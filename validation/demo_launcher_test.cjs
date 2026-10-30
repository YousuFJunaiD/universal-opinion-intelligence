// Synthetic launcher regression tests; no services, credentials or user data.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const http = require("node:http");
const { options, cacheRoot, inputFiles, acquireLock } = require("../scripts/local-demo.cjs");
const { localEnv, choosePort, probe, readPrepared, sourceFreshness } = require("../scripts/demo-runtime.cjs");

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "demo-launcher-test-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, "src"));
  await fs.mkdir(path.join(root, "public"));
  await fs.writeFile(path.join(root, "package-lock.json"), "{}");
  return root;
}

test("default demo and explicit modes are parsed", () => {
  assert.deepEqual(options([]), { dev: false, cached: false, prepare: false, port: 3000 });
  assert.equal(options(["--dev", "--port", "3100"]).port, 3100);
  assert.equal(options(["--cached"]).cached, true);
  assert.equal(options(["--prepare"]).prepare, true);
  assert.equal(options(["--hostname", "127.0.0.1"]).port, 3000);
  assert.equal(options(["--open"]).open, true);
});

test("missing or unverified prepared builds fail without any installation", async t => {
  const root=await fixture(t);
  assert.throws(()=>readPrepared(root),/No compatible HTTP-verified/);
  await fs.writeFile(path.join(root,"last-ready.json"),JSON.stringify({app:root,node:process.version}));
  assert.throws(()=>readPrepared(root),/No compatible HTTP-verified/);
});

test("freshness detects source edits and additions using metadata, not content reads", async t => {
  const root=await fixture(t), file=path.join(root,"src/page.ts");
  await fs.writeFile(file,"synthetic source");
  const metadata=[];
  for(const name of ["src/page.ts","package-lock.json"]){const stat=await fs.stat(path.join(root,name));metadata.push({path:name,size:stat.size,mtimeMs:stat.mtimeMs,ctimeMs:stat.ctimeMs});}
  const record={sourceRoot:root,sourceMetadata:metadata,configNames:["package-lock.json"]};
  const syncFs=require("node:fs"),old=syncFs.readFileSync;
  try {syncFs.readFileSync=()=>{throw Error("Source content must never be read");};assert.match(sourceFreshness(record),/No source metadata changes/);}finally{syncFs.readFileSync=old;}
  await fs.writeFile(file,"changed synthetic source");
  assert.match(sourceFreshness(record),/STALE/);
  await fs.writeFile(path.join(root,"public/new.txt"),"synthetic");
  assert.match(sourceFreshness(record),/STALE: source file set/);
});

test("missing source reports unknown freshness without pretending current", () => {
  assert.match(sourceFreshness({}),/UNKNOWN/);
  assert.match(sourceFreshness({sourceRoot:"/this-source-is-unavailable",sourceMetadata:[],configNames:[]}),/UNKNOWN/);
});
test("invalid ports and conflicting/unknown modes fail clearly", () => {
  for (const args of [["--port"], ["--port", "0"], ["--port", "65536"], ["--port", "3.5"], ["--dev", "--cached"], ["--hostname", "0.0.0.0"], ["--unknown"]]) assert.throws(() => options(args));
});
test("demo environment is local and ignores inherited secrets and Node hooks", () => {
  const keys = ["DATABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "PRIVATE_TEST_SECRET", "NODE_OPTIONS"];
  const before = keys.map(k => process.env[k]);
  try {
    for (const key of keys) process.env[key] = "SYNTHETIC_TEST_PLACEHOLDER";
    const env = localEnv();
    assert.equal(env.DATABASE_URL, "");
    assert.equal(env.SUPABASE_SERVICE_ROLE_KEY, "");
    assert.equal(env.PRIVATE_TEST_SECRET, undefined);
    assert.equal(env.NODE_OPTIONS, undefined);
    assert.equal(env.ANALYSIS_PROVIDER, "rule-based");
    assert.equal(env.DATA_ACCESS_MODE, "local");
    assert.equal(env.NEXT_PUBLIC_DATA_MODE, "local");
    assert.equal(env.SEARCH_PROVIDER, "disabled");
    assert.equal(localEnv("development").NODE_ENV, "development");
  } finally { keys.forEach((k, i) => before[i] === undefined ? delete process.env[k] : process.env[k] = before[i]); }
});
test("cache is independent of the Desktop source and keyed by workspace", () => {
  const a = cacheRoot("/some/Desktop/project");
  assert.ok(!a.includes("/Desktop/"));
  assert.notEqual(a, cacheRoot("/another/project"));
});
test("snapshot allowlist excludes env, private datasets, research, build cache and node_modules", async t => {
  const root = await fixture(t);
  for (const name of [".env.local", "README.md", "research.zip"]) await fs.writeFile(path.join(root, name), "synthetic");
  await fs.mkdir(path.join(root, "node_modules"));
  await fs.writeFile(path.join(root, "src", "page.ts"), "export {};");
  await fs.writeFile(path.join(root, "public", "sample.csv"), "text\nsynthetic");
  assert.deepEqual(await inputFiles(root), ["package-lock.json", "public/sample.csv", "src/page.ts"]);
});
test("source symlinks are refused instead of copying outside the project", async t => {
  const root = await fixture(t);
  await fs.symlink(path.join(root, "package-lock.json"), path.join(root, "public", "linked.json"));
  await assert.rejects(inputFiles(root), /Refusing source symlink/);
});
test("unlocked dependency installation is refused", async t => {
  const root = await fixture(t);
  await fs.unlink(path.join(root, "package-lock.json"));
  await assert.rejects(inputFiles(root), /package-lock.json is required/);
});
test("live preparation locks are preserved, not overwritten", async t => {
  const root = await fixture(t), lock = path.join(root, "prepare.lock");
  const handle = await acquireLock(lock);
  await handle.writeFile(String(process.pid));
  await handle.close();
  await assert.rejects(acquireLock(lock), /Another preparation is active/);
  assert.equal(await fs.readFile(lock, "utf8"), String(process.pid));
});
test("interrupted preparation recovers only a dead owner lock", async t => {
  const root = await fixture(t), lock = path.join(root, "prepare.lock");
  // A child that has exited supplies an actual dead PID, rather than guessing one.
  const { spawn } = require("node:child_process");
  const child = spawn(process.execPath, ["-e", "process.exit(0)"], { stdio: "ignore" });
  await new Promise((resolve, reject) => { child.on("error", reject); child.on("exit", resolve); });
  await fs.writeFile(lock, String(child.pid));
  const handle = await acquireLock(lock);
  await handle.close();
});
test("occupied ports are skipped without stopping the owner; readiness requires content and HTTP 200", async t => {
  let status = 200, body = "Run Analysis";
  const server = http.createServer((_req, res) => { res.writeHead(status); res.end(body); });
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  t.after(() => new Promise(resolve => server.close(resolve)));
  const port = server.address().port, url = `http://127.0.0.1:${port}/showcase`;
  assert.notEqual(await choosePort(port), port);
  assert.equal(await probe(url), true);
  body = "Wrong application";
  assert.equal(await probe(url), false);
  body = "Run Analysis"; status = 500;
  assert.equal(await probe(url), false);
});
