// Synthetic browser checks. Every invocation writes to a NEW directory by default.
// Playwright can be supplied via NODE_PATH; never overwrites historical evidence.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const base = process.argv[2] || "http://127.0.0.1:3000";
assert.equal(new URL(base).hostname,"127.0.0.1");
const output=path.resolve(process.env.PRESENTATION_TEST_OUTPUT_DIR || path.join(os.tmpdir(),`uoip-presentation-${Date.now()}-${process.pid}`));
fs.mkdirSync(output,{recursive:true});
const results={checks:[],external:[],api:[],errors:[],timing:{},output};
const check=async(name,fn)=>{await fn();results.checks.push({name,status:"pass"});console.log(`PASS ${name}`);};
const key="college-phase-2-showcase-report-v1";
let browser;
(async()=>{
 browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{})});
 const context=await browser.newContext({viewport:{width:1440,height:1100},acceptDownloads:true});
 await context.route("**/*",route=>{const u=new URL(route.request().url());if(u.origin!==base){results.external.push(u.origin);return route.abort();}if(u.pathname.startsWith("/api/"))results.api.push(u.pathname);return route.continue();});
 const page=await context.newPage();page.on("pageerror",e=>results.errors.push(e.message));
 const mode=page.getByRole("checkbox",{name:"Presentation Mode",exact:true});
 const input=page.getByRole("textbox",{name:"Pasted reviews/comments or CSV text"});
 const run=page.getByRole("button",{name:"Run Analysis",exact:true});
 const status=page.getByRole("status");
 const report=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
 const complete=()=>status.filter({hasText:"Analysis complete"}).waitFor();
 await page.goto(base+"/showcase");
 let paced;
 await check("default presentation executes five genuine stages in approximately 10 seconds",async()=>{
   assert.equal(await mode.isChecked(),true);
   const start=Date.now();await run.click();
   for(let i=0;i<5;i++)await page.locator(`[data-testid="pipeline-stage-${i}"][data-state="active"]`).waitFor();
   await complete();const elapsed=Date.now()-start;results.timing.presentationMs=elapsed;
   assert.ok(elapsed>=9500&&elapsed<16000,`Observed pacing ${elapsed} ms`);
   assert.equal(await page.locator('[data-state="complete"]').count(),5);
   assert.match(await page.getByTestId("pipeline-complete").innerText(),/intentional presentation pacing/);
   paced=await report();assert.equal(paced.engine.name,"browser-rule-based-showcase");
   assert.equal(paced.records.length,6);assert.ok(paced.qualityFlags.length===6);
   await page.screenshot({path:path.join(output,"presentation-completed.png"),fullPage:true});
 });
 await check("Fast Mode has no deliberate pacing and produces identical analytical outputs",async()=>{
   await mode.uncheck();const start=Date.now();await run.click();await complete();
   results.timing.fastMs=Date.now()-start;assert.ok(results.timing.fastMs<2000);
   const fast=await report();for(const field of ["records","summary","qualityFlags","themes","recommendation","engine"])assert.deepEqual(fast[field],paced[field]);
 });
 await check("invalid CSV is rejected promptly even in Presentation Mode",async()=>{
   await mode.check();await input.fill('text\n"unclosed');const before=await report();
   const start=Date.now();await run.click();await status.filter({hasText:"unclosed"}).waitFor();
   results.timing.invalidInputMs=Date.now()-start;assert.ok(results.timing.invalidInputMs<1500);
   assert.equal(await page.locator('[data-state="active"]').count(),0);assert.equal((await report()).id,before.id);
 });
 // Remaining interruption cases use controlled browser time, not claimed timings.
 await page.clock.install();
 await check("repeat clicks cannot start a second run; Cancel keeps the previous report",async()=>{
   await input.fill("A good product\nA bad product");const before=await report();
   await run.evaluate(el=>{el.click();el.click();});
   assert.equal(await run.isDisabled(),true);
   await page.clock.runFor(2100);
   await page.getByRole("button",{name:"Cancel analysis",exact:true}).click();
   await page.clock.runFor(12000);assert.equal((await report()).id,before.id);
   assert.equal(await run.isEnabled(),true);
 });
 await check("input edits and newer Fast Mode results defeat stale paced completions",async()=>{
   await run.click();await input.fill("The service is excellent\nThe service is poor");
   await mode.uncheck();await run.click();await complete();const newer=await report();
   await page.clock.runFor(12000);assert.equal((await report()).id,newer.id);assert.equal(newer.records.length,2);
 });
 await check("dataset change cancels pending analysis and preserves the last completed report",async()=>{
   await mode.check();const before=await report();await run.click();
   await page.getByRole("button",{name:/^Brand Feedback Demo/}).click();await status.filter({hasText:"Click Run Analysis"}).waitFor();
   await page.clock.runFor(12000);assert.equal((await report()).id,before.id);assert.equal(await run.isEnabled(),true);
 });
 await check("CSV upload cancels a run, preserves duplicate IDs and ignores manual-label columns",async()=>{
   await run.click();await page.getByLabel("Upload CSV").setInputFiles({name:"synthetic-presentation.csv",mimeType:"text/csv",buffer:Buffer.from('id,text,manual_label\nx,"Good product",negative\nx,"Bad product",positive')});
   await status.filter({hasText:"Loaded synthetic-presentation.csv"}).waitFor();await mode.uncheck();await run.click();await complete();
   const fresh=await report();assert.equal(fresh.records.length,2);assert.deepEqual(fresh.records.map(x=>x.sentiment),["positive","negative"]);
   assert.notEqual(fresh.records[0].id,fresh.records[1].id);await page.clock.runFor(12000);assert.equal((await report()).id,fresh.id);
 });
 await check("saved report restores and Markdown/JSON exports contain the actual results",async()=>{
   const before=await report();await page.reload();await status.filter({hasText:"Loaded latest saved"}).waitFor();assert.equal((await report()).id,before.id);
   for(const [label,ext]of[["Download Markdown","md"],["Download Evaluation JSON","json"]]){
     const waiting=page.waitForEvent("download");await page.getByRole("button",{name:label,exact:true}).click();const download=await waiting;
     const file=path.join(output,`synthetic-report.${ext}`);await download.saveAs(file);
     assert.match(fs.readFileSync(file,"utf8"),/browser-rule-based-showcase/);
     if(ext==="json")assert.equal(JSON.parse(fs.readFileSync(file)).id,before.id);
   }
 });
 await check("printing keeps report content and excludes the presentation controls",async()=>{
   await page.evaluate(()=>{window.__prints=0;window.print=()=>window.__prints++;});
   await page.getByRole("button",{name:"Print / Save PDF",exact:true}).click();assert.equal(await page.evaluate(()=>window.__prints),1);
   await page.emulateMedia({media:"print"});assert.equal(await page.locator("#printable-report").isVisible(),true);
   assert.equal(await page.getByRole("region",{name:"Analysis pipeline"}).isVisible(),false);
   await page.pdf({path:path.join(output,"synthetic-browser-print.pdf"),format:"A4",printBackground:true,preferCSSPageSize:true});await page.emulateMedia({media:"screen"});
 });
 await check("reset interrupts paced work and cannot resurrect the discarded snapshot",async()=>{
   await mode.check();await run.click();await page.getByRole("button",{name:"Reset Demo",exact:true}).click();await page.clock.runFor(12000);
   assert.equal(await report(),null);assert.equal(await page.locator("#printable-report").count(),0);
 });
 await check("navigation/unmount cancels unfinished work without saving",async()=>{
   await run.click();await page.getByRole("link",{name:"Home",exact:true}).click();await page.waitForURL(base+"/");await page.clock.runFor(12000);
   assert.equal(await report(),null);await page.goto(base+"/showcase");await run.waitFor();
 });
 await check("offline browser analysis and JSON export work with no backend requests",async()=>{
   await mode.uncheck();await context.setOffline(true);await run.click();await complete();assert.equal((await report()).engine.name,"browser-rule-based-showcase");
   const waiting=page.waitForEvent("download");await page.getByRole("button",{name:"Download Evaluation JSON",exact:true}).click();assert.equal(await(await waiting).failure(),null);await context.setOffline(false);
   assert.deepEqual(results.external,[]);assert.deepEqual(results.api,[]);assert.deepEqual(results.errors,[]);
 });
 results.status="pass";
})().catch(e=>{results.status="fail";results.failure=e.stack;console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();fs.writeFileSync(path.join(output,"presentation-validation.json"),JSON.stringify(results,null,2));console.log(`Evidence: ${output}`);});
