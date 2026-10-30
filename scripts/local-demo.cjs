#!/usr/bin/env node
// Run source snapshots and dependencies from non-cloud cache, never Desktop node_modules.
const fs = require("node:fs");
const fsp = fs.promises;
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawn, fork } = require("node:child_process");
const { localEnv, stop, serve } = require("./demo-runtime.cjs");
const ROOT = path.resolve(__dirname, "..");
const CONFIGS = ["package.json", "package-lock.json", "tsconfig.json", "next-env.d.ts", "next.config.ts", "next.config.js", "next.config.mjs", "tailwind.config.ts", "tailwind.config.js", "postcss.config.js", "postcss.config.mjs", ".eslintrc.json", ".eslintrc.js", ".eslintrc.cjs", "eslint.config.mjs"];
const hash = data => crypto.createHash("sha256").update(data).digest("hex");
function cacheRoot(root = ROOT) {
  const base = process.platform === "darwin" ? path.join(os.homedir(), "Library", "Caches") : (process.env.XDG_CACHE_HOME || path.join(os.homedir(), ".cache"));
  return path.join(base, "universal-opinion-intelligence", hash(root).slice(0,12));
}
function options(args) {
  const out = { dev: false, cached: false, prepare: false, port: 3000 };
  for (let i = 0; i < args.length; i++) {
    if (["--dev", "--cached", "--prepare"].includes(args[i])) out[args[i].slice(2)] = true;
    else if (args[i] === "--port") out.port = Number(args[++i]);
    else if (args[i] === "--hostname") { if (!["127.0.0.1", "localhost"].includes(args[++i])) throw new Error("The demo binds to loopback only. Use dev:direct for other network configurations."); }
    else throw new Error(`Unknown option: ${args[i]}`);
  }
  if (!Number.isInteger(out.port) || out.port < 1024 || out.port > 65535) throw new Error("Invalid --port; use an integer from 1024 to 65535.");
  if ([out.dev, out.cached, out.prepare].filter(Boolean).length > 1) throw new Error("Choose only one of --dev, --cached or --prepare.");
  return out;
}
async function inputFiles(root) {
  const result = [];
  async function walk(relative) {
    for (const entry of await fsp.readdir(path.join(root, relative), { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const name = path.join(relative, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`Refusing source symlink: ${name}`);
      if (entry.isDirectory()) await walk(name);
      else if (entry.isFile()) result.push(name);
    }
  }
  await walk("src"); await walk("public");
  for (const file of CONFIGS) {
    try {
      const stat = await fsp.lstat(path.join(root,file));
      if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Expected regular config file: ${file}`);
      result.push(file);
    } catch (e) { if (e.code !== "ENOENT") throw e; }
  }
  if (!result.includes("package-lock.json")) throw new Error("package-lock.json is required; no unpinned installation will be attempted.");
  return result.sort();
}
async function stage(cache, dev) {
  const target = await fsp.mkdtemp(path.join(cache, "snapshot-"));
  const files = [];
  for (const name of await inputFiles(ROOT)) {
    process.send?.({ reading: name });
    const bytes = await fsp.readFile(path.join(ROOT,name));
    const dest = path.join(target,name);
    await fsp.mkdir(path.dirname(dest), { recursive: true });
    await fsp.writeFile(dest, bytes);
    files.push({ path: name, sha256: hash(bytes) });
  }
  const fingerprint = hash(JSON.stringify({files,platform:process.platform,arch:process.arch,nodeMajor:process.versions.node.split(".")[0]}));
  const app = dev ? target : path.join(cache, "builds", fingerprint);
  if (!dev) {
    await fsp.mkdir(path.dirname(app), { recursive: true });
    try { await fsp.rename(target,app); }
    catch (e) { if (!["EEXIST", "ENOTEMPTY"].includes(e.code)) throw e; await fsp.rm(target,{recursive:true}); }
  }
  const result = { app, fingerprint, files, lockHash: files.find(f=>f.path==="package-lock.json").sha256 };
  process.send?.({ result });
  return result;
}
function stageWorker(cache, dev) {
  return new Promise((resolve,reject) => {
    let reading = "application manifest", result;
    const child = fork(__filename,["_stage",cache,dev?"dev":"production"],{env:localEnv(),stdio:["ignore","inherit","inherit","ipc"],detached:process.platform!=="win32"});
    const interrupt=()=>stop(child,"SIGKILL");
    process.on("SIGINT",interrupt);process.on("SIGTERM",interrupt);
    const clean=()=>{clearTimeout(timer);process.removeListener("SIGINT",interrupt);process.removeListener("SIGTERM",interrupt);};
    const timer = setTimeout(()=>{stop(child,"SIGKILL"); clean(); reject(new Error(`Source hydration timed out at ${reading}. No source was replaced. Use npm run demo:cached, or keep src/public downloaded in Finder before preparing.`));},120_000);
    child.on("message",m=>{if(m.reading)reading=m.reading;if(m.result)result=m.result;});
    child.on("error",e=>{clean();reject(e);});
    child.on("exit",code=>{clean();code===0&&result?resolve(result):reject(new Error(`Source snapshot failed at ${reading} (exit ${code}).`));});
  });
}
function command(bin,args,cwd,timeout=600_000) {
  return new Promise((resolve,reject)=>{
    const child=spawn(bin,args,{cwd,env:localEnv(),stdio:"inherit",detached:process.platform!=="win32"});
    let interrupted=false;
    const kill=()=>stop(child,"SIGKILL");
    const interrupt=()=>{interrupted=true;stop(child);};
    process.on("SIGINT",interrupt);process.on("SIGTERM",interrupt);
    const timer=setTimeout(kill,timeout);
    const clean=()=>{clearTimeout(timer);process.removeListener("SIGINT",interrupt);process.removeListener("SIGTERM",interrupt);};
    child.on("error",e=>{clean();reject(e);});
    child.on("exit",(code,signal)=>{clean();if(interrupted)return reject(Object.assign(new Error("Preparation interrupted; no retry will be started."),{code:"DEMO_INTERRUPTED"}));code===0?resolve():reject(new Error(`${path.basename(bin)} ${args[0]} failed (${signal||code}); see output above. No successful-build marker was written.`));});
  });
}
async function dependencies(cache, snapshot) {
  const folder=path.join(cache,"dependencies",`${snapshot.lockHash}-${process.platform}-${process.arch}-node${process.versions.node.split(".")[0]}-v2`);
  await fsp.mkdir(folder,{recursive:true});
  const ready=path.join(folder,"installed.json");
  if (!fs.existsSync(ready)) {
    for(const name of ["package.json","package-lock.json"])await fsp.copyFile(path.join(snapshot.app,name),path.join(folder,name));
    console.log("[demo] Installing pinned dependencies OUTSIDE cloud storage. Trying npm's offline cache first.");
    const npm=process.platform==="win32"?"npm.cmd":"npm";
    try { await command(npm,["ci","--offline","--include=dev","--ignore-scripts","--no-audit","--no-fund"],folder,180_000); }
    catch (error) {
      if(error.code==="DEMO_INTERRUPTED")throw error;
      console.log("[demo] Offline installation did not complete. Retrying with registry access; lockfile/configuration errors must still be resolved. Prepared launches need no install.");
      await command(npm,["ci","--include=dev","--ignore-scripts","--no-audit","--no-fund"],folder);
    }
    await fsp.writeFile(ready,JSON.stringify({lockHash:snapshot.lockHash,node:process.version})+"\n");
  }
  const link=path.join(snapshot.app,"node_modules");
  try {
    if((await fsp.lstat(link)).isSymbolicLink() && await fsp.readlink(link)!==path.join(folder,"node_modules"))await fsp.unlink(link);
  } catch(e) { if(e.code!=="ENOENT")throw e; }
  if(!fs.existsSync(link))await fsp.symlink(path.join(folder,"node_modules"),link,process.platform==="win32"?"junction":"dir");
  return folder;
}
async function watchDevelopment(app) {
  let timer, active=false, again=false, previous=new Set(await inputFiles(ROOT));
  const sync=async()=>{
    if(active){again=true;return;} active=true;
    try {
      const names=await inputFiles(ROOT);
      for(const name of names){const from=await fsp.readFile(path.join(ROOT,name));const to=path.join(app,name);let old;try{old=await fsp.readFile(to);}catch{}if(!old||!old.equals(from)){await fsp.mkdir(path.dirname(to),{recursive:true});await fsp.writeFile(to,from);}}
      for(const name of previous)if(!names.includes(name))await fsp.rm(path.join(app,name),{force:true});
      previous=new Set(names);
    }catch(e){console.error("[demo] Source sync failed:",e.message);}finally{active=false;if(again){again=false;sync();}}
  };
  const changed=()=>{clearTimeout(timer);timer=setTimeout(sync,250);};
  const watchers=[fs.watch(path.join(ROOT,"src"),{recursive:true},changed),fs.watch(path.join(ROOT,"public"),{recursive:true},changed),fs.watch(ROOT,(_event,name)=>{if(CONFIGS.includes(String(name)))changed();})];
  watchers.forEach(w=>w.on("error",e=>console.error("[demo] Watch error:",e.message)));
  return()=>{clearTimeout(timer);watchers.forEach(w=>w.close());};
}
async function acquireLock(lock) {
  try { return await fsp.open(lock,"wx"); }
  catch(e) {
    if(e.code!=="EEXIST")throw e;
    const value=await fsp.readFile(lock,"utf8");
    const pid=Number(value);
    if(Number.isInteger(pid)&&pid>0){
      try { process.kill(pid,0); }
      catch(error){
        if(error.code==="ESRCH"){
          // Only recover a dead owner's lock, and never stop an existing process.
          if(await fsp.readFile(lock,"utf8")===value){await fsp.unlink(lock);return fsp.open(lock,"wx");}
        }
      }
    }
    throw new Error(`Another preparation is active. Check ${lock}; use demo:cached meanwhile.`);
  }
}
async function main(args) {
  const opt=options(args),cache=cacheRoot();
  console.log(`[demo] Local-only mode. No database, Supabase, FastAPI or paid API is required.\n[demo] Cache: ${cache}`);
  await fsp.mkdir(cache,{recursive:true});
  if(opt.cached){const r=JSON.parse(await fsp.readFile(path.join(cache,"last-ready.json"),"utf8"));console.log(`[demo] Cached build from ${r.preparedAt}; current workspace edits are NOT included.`);return serve(r.app,opt);}
  const lock=path.join(cache,"prepare.lock");
  const handle=await acquireLock(lock);
  let snapshot,closeWatch;
  try {
    await handle.writeFile(String(process.pid));
    console.log("[demo] Snapshotting only src/, public/ (including bundled demo CSVs) and build configuration; no .env or private research/report directories.");
    snapshot=await stageWorker(cache,opt.dev);
    await dependencies(cache,snapshot);
    if(!opt.dev){
      const ready=path.join(snapshot.app,"demo-build.json");
      if(!fs.existsSync(ready)||!fs.existsSync(path.join(snapshot.app,".next/BUILD_ID"))){
        console.log("[demo] Building the complete application in secret-free local mode...");
        await command(process.execPath,[path.join(snapshot.app,"node_modules/next/dist/bin/next"),"build"],snapshot.app);
        if(!fs.existsSync(path.join(snapshot.app,".next/BUILD_ID")))throw new Error("Build did not produce BUILD_ID.");
        await fsp.writeFile(ready,JSON.stringify({...snapshot,preparedAt:new Date().toISOString(),node:process.version},null,2)+"\n");
      } else console.log("[demo] Reusing the matching prepared build; no compiler or install needed.");
      const record=JSON.parse(await fsp.readFile(ready,"utf8"));
      await fsp.writeFile(path.join(cache,"last-ready.json"),JSON.stringify(record,null,2)+"\n");
      await fsp.copyFile(path.join(__dirname,"demo-runtime.cjs"),path.join(cache,"start-demo.cjs"));
      console.log(`[demo] Offline rescue command: node ${JSON.stringify(path.join(cache,"start-demo.cjs"))}`);
    }
  } finally {await handle.close();await fsp.unlink(lock);}
  if(opt.prepare){console.log("[demo] PREPARED. Run npm run demo (or demo:cached) to start and verify HTTP readiness.");return 0;}
  if(opt.dev){closeWatch=await watchDevelopment(snapshot.app);console.log("[demo] Watching original src/public/config for development edits. Restart after dependency changes.");}
  try{return await serve(snapshot.app,opt);}finally{closeWatch?.();}
}
module.exports={options,cacheRoot,inputFiles,hash,acquireLock};
if(require.main===module){
  const args=process.argv.slice(2);
  (args[0]==="_stage"?stage(args[1],args[2]==="dev"):main(args)).then(code=>{if(typeof code==="number")process.exitCode=code;}).catch(e=>{console.error(`[demo] ${e.message}`);process.exitCode=1;});
}
