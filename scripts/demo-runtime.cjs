#!/usr/bin/env node
// Built-in Node modules only: also copied outside cloud storage as a rescue launcher.
const fs = require("node:fs");
const path = require("node:path");
const net = require("node:net");
const http = require("node:http");
const { spawn } = require("node:child_process");

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
async function serve(app, { dev = false, port = 3000, onReady } = {}) {
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
        console.log(`\n[demo] READY: HTTP 200 and showcase content verified.\n[demo] Open ${url}\n[demo] Keep this terminal open; Ctrl+C stops only this demo.\n`);
        if (onReady) await onReady({ url, port: chosen });
        return await exit;
      }
      await new Promise(resolve => setTimeout(resolve, 350));
    }
    throw new Error(ended ? "Next.js exited before the showcase became ready." : "Showcase HTTP readiness timed out. Use npm run demo:cached for the last prepared build.");
  } finally {
    stop(child);
    process.removeListener("SIGINT", interrupt); process.removeListener("SIGTERM", interrupt);
  }
}
async function rescue() {
  const record = JSON.parse(fs.readFileSync(path.join(__dirname, "last-ready.json"), "utf8"));
  console.log(`[demo] Using previously prepared source ${record.fingerprint.slice(0, 12)} (${record.preparedAt}).`);
  return serve(record.app, { port: Number(process.argv[2] || 3000) });
}
module.exports = { localEnv, stop, choosePort, probe, serve };
if (require.main === module) rescue().then(code => { process.exitCode = code; }).catch(e => { console.error(`[demo] ${e.message}`); process.exitCode = 1; });
