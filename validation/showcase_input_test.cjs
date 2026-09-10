// Regression checks for the bounded browser intake and evidence identity.
// Uses TypeScript already declared in package.json; no extra test dependency.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) => {
  const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  });
  module._compile(output.outputText, filename);
};
const { parseShowcaseInput } = require("../src/lib/services/showcase-input-service.ts");
const { flagReviewQuality } = require("../src/lib/services/review-quality-service.ts");
let passed = 0;
function check(name, action) { action(); passed += 1; console.log(`PASS ${name}`); }
check("one-column CSV excludes header", () => assert.equal(parseShowcaseInput("text\nGood product\nBad product").length, 2));
check("quoted commas, escaped quotes, and multiline fields", () => {
  const rows = parseShowcaseInput('id,text\n1,"Battery, screen and ""camera""\nworked well"', true);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].text, 'Battery, screen and "camera"\nworked well');
});
check("duplicate source IDs keep independent evidence rows", () => {
  const rows = parseShowcaseInput("id,text\nx,Good\nx,Bad", true);
  assert.notEqual(rows[0].id, rows[1].id);
  assert.equal(rows[0].sourceRecordId, rows[1].sourceRecordId);
});
check("blank rows skipped without deduplicating content", () => assert.equal(parseShowcaseInput("Good\n\nGood").length, 2));
check("missing CSV header rejected", () => assert.throws(() => parseShowcaseInput("id,rating\n1,5", true), /column/));
check("unclosed quote rejected", () => assert.throws(() => parseShowcaseInput('text\n"Unclosed', true), /unclosed/));
check("ragged CSV rejected", () => assert.throws(() => parseShowcaseInput("id,text\n1,good,extra", true), /column count/));
check("250-record limit enforced", () => assert.throws(() => parseShowcaseInput(Array(251).fill("Good").join("\n")), /250/));
check("record length limited", () => assert.throws(() => parseShowcaseInput("a".repeat(5001)), /5,000/));
check("overall input length limited", () => assert.throws(() => parseShowcaseInput("a".repeat(250001)), /250,000/));
check("plain text quotes remain plain text", () => assert.equal(parseShowcaseInput('The staff said "hello"')[0].text, 'The staff said "hello"'));
check("duplicate flags identify the earlier row", () => {
  const flags = flagReviewQuality(parseShowcaseInput("The battery lasts a full day\nThe battery lasts a full day"));
  assert.ok(flags[1].reasons.includes("Repeated review text"));
  assert.ok(flags[1].evidence.some((value) => value.includes("row-1")));
});
check("non-Latin empty normalization is not an exact-duplicate match", () => {
  const flags = flagReviewQuality(parseShowcaseInput("अच्छा\nखराब"));
  assert.ok(!flags[1].reasons.includes("Repeated review text"));
});
check("college concrete terms reduce product-domain bias", () => {
  const flags = flagReviewQuality(parseShowcaseInput("The lab opens every day"));
  assert.ok(!flags[0].reasons.includes("No concrete feature mentioned"));
});
for (const name of ["demo_product_reviews", "demo_brand_feedback", "demo_public_figure_comments"]) {
  check(`${name}: 15 synthetic rows with unique evidence IDs`, () => {
    const rows = parseShowcaseInput(fs.readFileSync(`public/demo-data/${name}.csv`, "utf8"), true);
    assert.equal(rows.length, 15);
    assert.equal(new Set(rows.map((row) => row.id)).size, 15);
    assert.ok(rows.every((row) => row.source.startsWith("synthetic_")));
  });
}
console.log(`${passed} checks passed.`);
