#!/usr/bin/env node
// Built-in Node modules only: also copied outside cloud storage as a rescue launcher.
const fs = require("node:fs");
const path = require("node:path");
const net = require("node:net");
const http = require("node:http");
const { spawn, fork } = require("node:child_process");

function openBrowser(url) {
  if (process.platform !== "darwin") { console.log(`[demo] Open ${url} in your browser.`); return; }
  const child = spawn("/usr/bin/open", [url], { stdio: "ignore" });
  child.on("error", () => console.error(`[demo] Could not open browser automatically. Open ${url}`));
}

function readPrepared(cache) {
  try {
    const record = JSON.parse(fs.readFileSync(path.join(cache, "last-ready.json"), "utf8"));
    if (!record.verifiedAt || !record.app || !fs.existsSync(path.join(record.app, ".next/BUILD_ID")) || !fs.existsSync(path.join(record.app, "node_modules/next/dist/bin/next"))) throw new Error("Incomplete build");
    if (record.node.split(".")[0] !== process.version.split(".")[0]) throw new Error("Node major changed");
    return record;
  } catch {
    throw new Error("No compatible HTTP-verified prepared build is available. In the project folder run npm run demo:prepare while online, then launch again. No installation or compilation was attempted. A previously saved Markdown/print report can be used as a static fallback.");
  }
}

// Metadata only: do not open source contents (which can hydrate cloud files).
function sourceFreshness(record) {
  if (!record.sourceRoot || !record.sourceMetadata) return "UNKNOWN: this build has no source metadata. Run demo:prepare after source changes.";
  const names = [];
  const walk = dir => {
    for (const e of fs.readdirSync(path.join(record.sourceRoot, dir), { withFileTypes: true })) {
      if (e.name.startsWith(".")) continue;
      const name = path.join(dir,e.name);
      if (e.isSymbolicLink()) throw new Error("Source symlink");
      if(e.isDirectory())walk(name);else if(e.isFile())names.push(name);
    }
  };
  try {
    walk("src");walk("public");
    for(const name of record.configNames)if(fs.existsSync(path.join(record.sourceRoot,name)))names.push(name);
    const old = record.sourceMetadata;
    if(names.length!==old.length)return "STALE: source file set changed since preparation. Run npm run demo:prepare after the presentation; this launch keeps the cached build.";
    const byName = new Map(old.map(x=>[x.path,x]));
    for(const name of names){const prior=byName.get(name), stat=fs.statSync(path.join(record.sourceRoot,name));if(!prior||prior.size!==stat.size||prior.mtimeMs!==stat.mtimeMs||prior.ctimeMs!==stat.ctimeMs)return "STALE: source metadata changed since preparation. Cached build excludes later edits. Run npm run demo:prepare to include them.";}
    return "No source metadata changes detected. Source content was not read or rehashed during this launch.";
  } catch { return "UNKNOWN: source metadata is unavailable. Using the cached build; no source hydration attempted."; }
}

function boundedFreshness(cache) {
  return new Promise(resolve => {
    const worker = fork(__filename,["--freshness",cache],{env:localEnv(),stdio:["ignore","ignore","ignore","ipc"]});
    const timer=setTimeout(()=>{worker.kill("SIGKILL");resolve("UNKNOWN: metadata check timed out. Cached launch continues without reading source content.");},1200);
    worker.on("message",value=>{clearTimeout(timer);resolve(value);});
    worker.on("error",()=>{clearTimeout(timer);resolve("UNKNOWN: metadata check unavailable; using cached build.");});
    worker.on("exit",()=>{clearTimeout(timer);resolve("UNKNOWN: metadata check unavailable; using cached build.");});
  });
}

async function startCached(cache, options={}) {
  const started=performance.now(), record=readPrepared(cache), activePath=path.join(cache,"active-demo.json");
  console.log(`[demo] Prepared ${record.preparedAt}; HTTP verified ${record.verifiedAt}. Cached-only launch: no install, downloads, source copying or compilation.`);
  const freshness=boundedFreshness(cache).then(result=>console.log(`[demo] ${result}`));
  let active;
  try {active=JSON.parse(fs.readFileSync(activePath,"utf8"));process.kill(active.pid,0);}catch{active=null;}
  if(active?.app===record.app && /^http:\/\/127\.0\.0\.1:\d+\/showcase$/.test(active.url) && await probe(active.url)){
    await freshness;
    console.log(`[demo] Reusing the running prepared build: ${active.url} (${Math.round(performance.now()-started)} ms observed).`);
    if(options.open)openBrowser(active.url);
    return 0;
  }
  return serve(record.app,{...options,onReady:async info=>{
    fs.writeFileSync(activePath,JSON.stringify({...info,app:record.app}));
    await freshness;
    console.log(`[demo] Measured launcher-to-HTTP readiness: ${Math.round(performance.now()-started)} ms (this run only).`);
    if(options.open)openBrowser(info.url);
    if(options.onReady)await options.onReady(info);
  },onExit:pid=>{try{if(JSON.parse(fs.readFileSync(activePath,"utf8")).pid===pid)fs.unlinkSync(activePath);}catch{}}});
}

function localEnv(mode = "production") {
  // Deliberately do not forward NODE_OPTIONS, credentials or service configuration.
  const env = {};
  for (const key of ["PATH", "HOME", "USERPROFILE", "TMPDIR", "TEMP", "TMP", "SystemRoot", "ComSpec", "TERM", "LANG", "LC_ALL"])
    if (process.env[key]) env[key] = process.env[key];
  return Object.assign(env, {
    NODE_ENV: mode, NEXT_TELEMETRY_DISABLED: "1", NEXT_PUBLIC_DATA_MODE: "local",
    DATA_ACCESS_MODE: "local", AUTH_MODE: "dev", ANALYSIS_PROVIDER: "rule-based",
    SEARCH_PROVIDER: "disabled", DATABASE_URL: "", NEXT_PUBLIC_SUPABASE_URL: "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "", SUPABASE_SERVICE_ROLE_KEY: "",
    FASTAPI_ML_URL: "http://127.0.0.1:8000"
  });
}
function stop(child, signal = "SIGTERM") {
  if (!child || !child.pid || child.exitCode !== null) return;
  try {
    if (process.platform === "win32") child.kill(signal);
    else process.kill(-child.pid, signal);
  } catch (e) { if (e.code !== "ESRCH") console.error("[demo] Could not stop child:", e.code); }
}
function portFree(port) {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", e => e.code === "EADDRINUSE" ? resolve(false) : reject(e));
    probe.listen(port, "127.0.0.1", () => probe.close(() => resolve(true)));
  });
}
async function choosePort(first) {
  if (!Number.isInteger(first) || first < 1024 || first > 65535) throw new Error("Port must be an integer from 1024 to 65535.");
  for (let p = first; p <= Math.min(first + 10, 65535); p++) if (await portFree(p)) return p;
  throw new Error("No free demo port in the selected range. Existing servers were not stopped.");
}
function probe(url) {
  return new Promise(resolve => {
    const req = http.get(url, res => {
      let text = "";
      res.on("data", b => { if (text.length < 3_000_000) text += b; });
      res.on("end", () => resolve(res.statusCode === 200 && text.includes("Run Analysis")));
    });
    req.setTimeout(1500, () => req.destroy());
    req.on("error", () => resolve(false));
  });
}
async function serve(app, { dev = false, port = 3000, onReady, onExit, verifyOnly = false } = {}) {
  const chosen = await choosePort(port);
  const url = `http://127.0.0.1:${chosen}/showcase`;
  console.log(`[demo] ${dev ? "Development" : "Offline presentation"} runtime: ${app}`);
  console.log(`[demo] Checking actual HTTP readiness at ${url}`);
  const child = spawn(process.execPath, [path.join(app, "node_modules/next/dist/bin/next"), dev ? "dev" : "start", "--hostname", "127.0.0.1", "--port", String(chosen)], {
    cwd: app, env: localEnv(dev ? "development" : "production"), stdio: "inherit", detached: process.platform !== "win32"
  });
  let ended = false;
  const exit = new Promise(resolve => {
    child.on("error", e => { console.error(e.message); ended = true; resolve(1); });
    child.on("exit", code => { ended = true; resolve(code ?? 0); });
  });
  const interrupt = () => stop(child);
  process.on("SIGINT", interrupt); process.on("SIGTERM", interrupt);
  try {
    const deadline = Date.now() + (dev ? 180_000 : 60_000);
    while (!ended && Date.now() < deadline) {
      if (await probe(url)) {
        console.log(`\n[demo] READY: HTTP 200 and showcase content verified.\n[demo] Open ${url}\n[demo] ${verifyOnly ? "Prepared-build HTTP check passed; stopping this temporary verification server." : "Keep this terminal open; Ctrl+C stops only this demo."}\n`);
        if (onReady) await onReady({ url, port: chosen, pid: child.pid });
        if (verifyOnly) stop(child);
        return await exit;
      }
      await new Promise(resolve => setTimeout(resolve, 350));
    }
    throw new Error(ended ? "Next.js exited before the showcase became ready." : "Showcase HTTP readiness timed out. Use npm run demo:cached for the last prepared build.");
  } finally {
    stop(child);
    if(onExit)onExit(child.pid);
    process.removeListener("SIGINT", interrupt); process.removeListener("SIGTERM", interrupt);
  }
}
async function rescue() {
  const args=process.argv.slice(2), port=Number(args.find(x=>/^\d+$/.test(x))||3000);
  return startCached(__dirname,{port,open:args.includes("--open")});
}
module.exports = { localEnv, stop, choosePort, probe, serve, startCached, readPrepared, sourceFreshness, openBrowser };
if (require.main === module) {
  if(process.argv[2]==="--freshness"){
    try {process.send?.(sourceFreshness(readPrepared(process.argv[3])));}catch{process.send?.("UNKNOWN: preparation record unavailable.");}
  } else rescue().then(code => { process.exitCode = code; }).catch(e => { console.error(`[demo] ${e.message}`); process.exitCode = 1; });
}
