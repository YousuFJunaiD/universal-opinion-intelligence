// Browser regression/proof run, using isolated storage and synthetic data only.
// Requires Playwright available through installation or NODE_PATH.
// Optional: PLAYWRIGHT_CHROMIUM_EXECUTABLE points to an existing compatible browser.
// Run: node validation/showcase_browser_test.cjs http://127.0.0.1:3000
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const baseUrl = process.argv[2] || "http://127.0.0.1:3000";
if (!["127.0.0.1", "localhost"].includes(new URL(baseUrl).hostname)) throw new Error("This verification script is for a local server only.");
const key = "college-phase-2-showcase-report-v1";
// Never overwrite historical evidence by default. Explicit output overrides are
// supported for callers that organize their own fresh verification directories.
const output = path.resolve(process.env.SHOWCASE_TEST_OUTPUT_DIR || path.join(require("node:os").tmpdir(), `uoip-showcase-${Date.now()}-${process.pid}`));
console.log(`Browser verification artifacts: ${output}`);
const results = { checkedAt: new Date().toISOString(), baseUrl, checks: [], demos: [], errors: [], externalAttempts: [], apiCalls: [] };
let browser;
const check = async (name, action) => { await action(); results.checks.push({ name, status: "pass" }); console.log(`PASS ${name}`); };
async function run(page) {
  await page.getByRole("button", { name: "Run Analysis", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Analysis complete" }).waitFor();
}
async function report(page) { return page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey)), key); }
async function context() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  await ctx.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (!["http:", "https:"].includes(url.protocol)) return route.continue();
    if (url.origin !== new URL(baseUrl).origin) { results.externalAttempts.push(url.origin); return route.abort(); }
    if (url.pathname.startsWith("/api/")) results.apiCalls.push(url.pathname);
    return route.continue();
  });
  ctx.on("page", (page) => {
    page.on("pageerror", (error) => results.errors.push(error.message));
    page.on("console", (msg) => { if (msg.type() === "error") results.errors.push(msg.text()); });
  });
  return ctx;
}
(async () => {
  fs.mkdirSync(output, { recursive: true });
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}) });
  results.browser = browser.version();
  const ctx = await context();
  const page = await ctx.newPage();
  await check("home renders with illustrative metrics labelled and showcase link", async () => {
    await page.goto(baseUrl);
    assert.match(await page.locator("h1").innerText(), /Trust Analysis Platform/);
    assert.match(await page.locator("body").innerText(), /synthetic values, not a live analysis/);
    await page.getByRole("link", { name: "Final Showcase Demo", exact: true }).first().click();
  });
  await check("showcase renders six use-case cards", async () => {
    await page.getByRole("button", { name: "Run Analysis", exact: true }).waitFor();
    assert.equal(await page.locator('[aria-label="Use case selection"] button').count(), 6);
    assert.equal(await page.locator('[data-nextjs-dialog]').count(), 0);
    await page.screenshot({ path: path.join(output, "showcase-input-desktop.png"), fullPage: true });
  });
  for (const [name, source] of [["Product Reviews Demo", "product"], ["Brand Feedback Demo", "brand"], ["Public Figure Comments Demo", "public_figure"]]) {
    await check(`${name} → 15-row saved report`, async () => {
      await page.getByRole("button", { name: new RegExp(name) }).click();
      await page.getByRole("status").filter({ hasText: "Click Run Analysis" }).waitFor();
      await run(page);
      const data = await report(page);
      assert.equal(data.records.length, 15);
      assert.equal(data.sourceType, source);
      assert.equal(data.engine.name, "browser-rule-based-showcase");
      assert.equal(data.summary.positiveCount + data.summary.negativeCount + data.summary.neutralCount, 15);
      assert.ok(data.summary.suspiciousCount > 0);
      assert.ok(data.qualityFlags.every((flag) => flag.reasons.length && flag.evidence.length));
      results.demos.push({ name, summary: data.summary, engine: data.engine, category: data.recommendation.category });
      if (source === "product") await page.screenshot({ path: path.join(output, "product-report-desktop.png"), fullPage: true });
    });
  }
  await check("report and matching input survive reload and browser-context restart", async () => {
    const before = await report(page);
    await page.reload();
    await page.getByRole("status").filter({ hasText: "Loaded latest saved" }).waitFor();
    assert.equal((await report(page)).id, before.id);
    assert.ok((await page.getByRole("textbox", { name: "Pasted reviews/comments or CSV text" }).inputValue()).includes(before.records[0].text));
    // Transfer isolated synthetic origin storage into a new browser context; no user profile is touched.
    const state = await ctx.storageState();
    const restored = await browser.newContext({ storageState: state });
    const restoredPage = await restored.newPage();
    await restoredPage.goto(`${baseUrl}/showcase`);
    await restoredPage.getByRole("status").filter({ hasText: "Loaded latest saved" }).waitFor();
    assert.equal((await report(restoredPage)).id, before.id);
    await restored.close();
  });
  await check("Markdown download contains every row, engine and limitations", async () => {
    const pending = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download Markdown", exact: true }).click();
    const download = await pending;
    const target = path.join(output, "synthetic-showcase-report.md");
    await download.saveAs(target);
    const text = fs.readFileSync(target, "utf8");
    assert.equal((text.match(/^### Record /gm) || []).length, 15);
    assert.match(text, /browser-rule-based-showcase/);
    assert.match(text, /not confirmed fake/);
    assert.match(text, /Limitations/);
  });
  await check("Print button invokes window.print and print CSS exposes report", async () => {
    await page.evaluate(() => { window.__showcasePrintCalls = 0; window.print = () => { window.__showcasePrintCalls += 1; }; });
    await page.getByRole("button", { name: "Print / Save PDF", exact: true }).click();
    assert.equal(await page.evaluate(() => window.__showcasePrintCalls), 1);
    await page.emulateMedia({ media: "print" });
    assert.equal(await page.locator("#printable-report").evaluate((element) => getComputedStyle(element).visibility), "visible");
    await page.pdf({ path: path.join(output, "synthetic-showcase-print.pdf"), format: "A4", printBackground: true, preferCSSPageSize: true });
    await page.emulateMedia({ media: "screen" });
  });
  await check("college use case and repeated domain keywords", async () => {
    await page.getByRole("button", { name: /^College Feedback/ }).click();
    await page.getByRole("textbox", { name: "Pasted reviews/comments or CSV text" }).fill("The lab equipment is excellent and useful.\nThe lab schedule is clear and helpful.\nFaculty explained the lesson clearly.\nThe canteen service is slow and poor.\nThe classroom has forty seats.");
    await run(page);
    const data = await report(page);
    assert.equal(data.sourceType, "college");
    assert.ok(data.themes.some((theme) => theme.theme === "Lab" && theme.count === 2));
  });
  await check("basic negation and neutral cues on pasted text", async () => {
    await page.getByRole("textbox", { name: "Pasted reviews/comments or CSV text" }).fill("This is not good\nSupport ticket number 24\nThe charger stopped working\nThe battery is not bad\nThe service was good");
    await run(page);
    assert.deepEqual((await report(page)).records.map((row) => row.sentiment), ["negative", "neutral", "negative", "positive", "positive"]);
  });
  await check("CSV upload preserves use case and duplicate source IDs", async () => {
    await page.getByLabel("Upload CSV").setInputFiles({ name: "synthetic.csv", mimeType: "text/csv", buffer: Buffer.from('id,text\nx,"Good, useful lab"\nx,"Bad canteen"') });
    await page.getByRole("status").filter({ hasText: "Loaded synthetic.csv" }).waitFor();
    await run(page);
    const data = await report(page);
    assert.equal(data.sourceType, "college");
    assert.equal(new Set(data.records.map((row) => row.id)).size, 2);
  });
  await check("malformed CSV and oversized row count recover", async () => {
    const input = page.getByRole("textbox", { name: "Pasted reviews/comments or CSV text" });
    await input.fill('text\n"not closed');
    await page.getByRole("button", { name: "Run Analysis", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "unclosed" }).waitFor();
    await input.fill(Array(251).fill("Good product").join("\n"));
    await page.getByRole("button", { name: "Run Analysis", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "at most 250" }).waitFor();
    assert.ok(await page.getByRole("button", { name: "Run Analysis", exact: true }).isEnabled());
  });
  await check("reset clears only the showcase snapshot and cancels pending analysis", async () => {
    await page.getByRole("textbox", { name: "Pasted reviews/comments or CSV text" }).fill("Good product");
    await page.getByRole("button", { name: "Run Analysis", exact: true }).click();
    await page.getByRole("button", { name: "Reset Demo", exact: true }).click();
    await page.waitForTimeout(400);
    assert.equal(await page.evaluate((storageKey) => localStorage.getItem(storageKey), key), null);
    assert.equal(await page.locator("#printable-report").count(), 0);
  });
  await check("corrupt saved snapshot does not crash", async () => {
    await page.evaluate((storageKey) => localStorage.setItem(storageKey, '{"records":null}'), key);
    await page.reload();
    await page.getByRole("status").filter({ hasText: "could not be restored" }).waitFor();
    assert.ok(await page.getByRole("button", { name: "Run Analysis", exact: true }).isEnabled());
  });
  await check("unavailable storage still allows analysis and export", async () => {
    const blocked = await context();
    await blocked.addInitScript((storageKey) => {
      for (const method of ["getItem", "setItem", "removeItem"]) {
        const original = Storage.prototype[method];
        Storage.prototype[method] = function (...args) { if (args[0] === storageKey) throw new DOMException("Unavailable", "QuotaExceededError"); return original.apply(this, args); };
      }
    }, key);
    const blockedPage = await blocked.newPage();
    await blockedPage.goto(`${baseUrl}/showcase`);
    await run(blockedPage);
    assert.match(await blockedPage.getByRole("status").innerText(), /not saved/);
    assert.ok(await blockedPage.getByRole("button", { name: "Download Markdown" }).isVisible());
    await blocked.close();
  });
  await check("failed demo fetch recovers to pasted input", async () => {
    const failed = await context();
    await failed.route("**/demo-data/*.csv", (route) => route.fulfill({ status: 503, body: "Unavailable" }));
    const failedPage = await failed.newPage();
    await failedPage.goto(`${baseUrl}/showcase`);
    await failedPage.getByRole("button", { name: /^Product Reviews Demo/ }).click();
    await failedPage.getByRole("status").filter({ hasText: "Could not load" }).waitFor();
    await run(failedPage);
    assert.ok(await failedPage.locator("#printable-report").isVisible());
    await failed.close();
  });
  await check("mobile layout has no horizontal overflow", async () => {
    await page.getByRole("button", { name: "Reset Demo", exact: true }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    await run(page);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: path.join(output, "showcase-mobile.png"), fullPage: true });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(output, "showcase-mobile-first-screen.png") });
  });
  await check("no ML, database, search API or external dependency requested", async () => {
    assert.deepEqual(results.apiCalls, []);
    assert.deepEqual(results.externalAttempts, []);
  });
  await check("no unexpected browser errors", async () => {
    // A deliberately injected demo-fetch HTTP 503 can create one console resource error.
    results.expectedErrors = results.errors.filter((error) => /503.*Service Unavailable|status of 503/.test(error));
    results.unexpectedErrors = results.errors.filter((error) => !results.expectedErrors.includes(error));
    assert.deepEqual(results.unexpectedErrors, []);
  });
  results.status = "pass";
})().catch((error) => { results.status = "fail"; results.failure = error.message; console.error(error); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, "browser-validation.json"), JSON.stringify(results, null, 2) + "\n");
});
