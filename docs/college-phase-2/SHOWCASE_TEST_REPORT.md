# Showcase Test Report — College Phase-II

Final verification: **10 September 2026, approximately 05:04 IST**. Route: `/showcase`. This replaces the earlier HTTP/build-only status with browser regression evidence from the final local production build. It does not repeat the full project audit.

## 1. Summary

**Pass for the tested local showcase:** typecheck, lint, safe build, 17 input/quality checks, and 19 browser checks. All three demos, saved-report refresh, actual Markdown download, and the inspected A4 print layout passed. The native OS print dialog, physical printer, and other browser engines remain manual checks.

| Check | Result | Detail |
|---|---|---|
| TypeScript | Pass | `npm run typecheck` |
| ESLint | Pass | `npm run lint`; no ESLint warnings/errors. Next.js reports deprecation of its lint CLI. |
| Production build | Pass | Requested safe local environment; all 26 pages generated, including `/showcase`. |
| Intake/quality regression | 17 passed | Existing TypeScript transpilation hook runs real parser/quality modules. |
| Browser regression | 19 passed | Chromium `147.0.7727.15`, isolated contexts, local server only. |
| Print visual inspection | Pass for generated sample | All four A4 pages reviewed after the final card-layout correction. |
| Tracked-diff whitespace check | Pass | `git diff --check`; not a full untracked-file or security audit. |

## 2. Exact commands

From the repository root:

```bash
npm run typecheck
npm run lint
node validation/showcase_input_test.cjs
env DATA_ACCESS_MODE=local NEXT_PUBLIC_DATA_MODE=local AUTH_MODE=dev ANALYSIS_PROVIDER=local FASTAPI_ML_URL=http://127.0.0.1:8000 DATABASE_URL= NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= SUPABASE_SERVICE_ROLE_KEY= npm run build
```

The final browser run used `next start` against this completed build, not a development server:

```bash
env DATA_ACCESS_MODE=local NEXT_PUBLIC_DATA_MODE=local AUTH_MODE=dev ANALYSIS_PROVIDER=local SEARCH_PROVIDER=disabled FASTAPI_ML_URL=http://127.0.0.1:8000 DATABASE_URL= NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= SUPABASE_SERVICE_ROLE_KEY= npm run start -- --hostname 127.0.0.1 --port 3000
```

In another terminal, with Playwright and a compatible Chromium available:

```bash
node validation/showcase_browser_test.cjs http://127.0.0.1:3000
```

Playwright is currently provided by this workstation's tooling, not declared as a project test dependency. The command actually used supplied those existing paths without installing packages:

```bash
NODE_PATH=/Users/yusuf/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules PLAYWRIGHT_CHROMIUM_EXECUTABLE=/Users/yusuf/Library/Caches/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-mac-arm64/chrome-headless-shell node validation/showcase_browser_test.cjs http://127.0.0.1:3000
```

Those two paths are machine-specific tooling locations, not credentials; replace them with available equivalents on another machine. Observed runtime: Node.js `v24.11.1`, npm `11.6.2`, Next.js `15.5.18`. No clean-machine installation claim is made.

## 3. Demo results

| Demo | Local CSV | Total | Positive | Negative | Neutral/tied/no cue | Manual-review flags |
|---|---|---:|---:|---:|---:|---:|
| Product Reviews Demo | `public/demo-data/demo_product_reviews.csv` | 15 | 6 | 5 | 4 | 7 |
| Brand Feedback Demo | `public/demo-data/demo_brand_feedback.csv` | 15 | 4 | 6 | 5 | 7 |
| Public Figure Comments Demo | `public/demo-data/demo_public_figure_comments.csv` | 15 | 3 | 4 | 8 | 7 |

Engine: **`browser-rule-based-showcase` v1.1.0**. These synthetic output counts are not an accuracy benchmark and must not be associated with the separate RoBERTa results. Flags indicate text-quality review priority, not verified deception, fraud, bots, or product/person trustworthiness.

## 4. Browser checks executed

| # | Check | Result / scope |
|---:|---|---|
| 1 | Homepage title, illustrative metrics, showcase link | Pass; homepage sample metrics explicitly labeled synthetic. |
| 2 | `/showcase` opens and displays six use-case cards | Pass; no Next.js error dialog. |
| 3 | Product Reviews Demo | Pass; 15-row report, engine metadata, count sum, and flag evidence. |
| 4 | Brand Feedback Demo | Pass; same assertions on its separate dataset. |
| 5 | Public Figure Comments Demo | Pass; same assertions on its separate dataset. |
| 6 | Saved report restoration | Pass; reload retained report identity and matching input; new isolated context seeded with saved storage also restored the report. |
| 7 | Markdown download | Pass; actual download saved, all 15 record entries present, engine and limitations included. |
| 8 | Print action and print CSS | Pass; instrumented `window.print()` invoked once, printable report visible, PDF generated. |
| 9 | College feedback/domain keyword case | Pass; selected use case retained and repeated Lab mentions counted. |
| 10 | Basic negation/neutral examples | Pass for five specific examples; not general language understanding. |
| 11 | CSV upload and repeated source IDs | Pass; selected domain retained and internal row identities remained distinct. |
| 12 | Malformed CSV and oversized row count | Pass; clear error status and usable Run Analysis control. |
| 13 | Reset during pending analysis | Pass; pending report did not reappear; showcase snapshot removed. |
| 14 | Corrupt stored snapshot | Pass; recovery message without crashing the page. |
| 15 | Storage denied/unavailable | Pass; report still generated in memory and export remained visible; status disclosed that saving failed. |
| 16 | Failed demo fetch | Pass; injected HTTP 503 handled and pasted-input analysis still worked. |
| 17 | Mobile layout | Pass at 390 × 844 viewport; no horizontal overflow; screenshots captured. |
| 18 | External/API independence | Pass in instrumented contexts; no `/api/` calls or external HTTP(S) attempts recorded. |
| 19 | Browser errors | Pass; no unexpected errors. One expected resource error came from the injected HTTP 503 test. |

The storage-context transfer is not an actual operating-system/browser restart. Reset's automated assertion verifies removal of the showcase key and cancellation; code inspection confirms it does not call `localStorage.clear()`. The suite is a bounded regression sample, not coverage of every possible input or failure.

## 5. Print-layout verification

Final source correction: apply the existing `avoid-break` class to the Final recommendation and Model and engine metadata wrappers. Existing no-break treatment for short evidence panels and individual review-quality cards remains in place.

The Public Figure report was exported to an A4 PDF and all **four pages** were rendered and visually inspected:

- Page 1: totals, recommendation, and positive/negative evidence cards remained together.
- Page 2: neutral examples stayed intact; the long review-quality section began with complete individual cards.
- Page 3: remaining quality cards and keyword group card remained intact. The enclosing multi-card section appropriately continued from the preceding page.
- Page 4: engine heading and metadata stayed in one card, followed by the complete limitations panel. The earlier separated heading was resolved.

No clipped or badly split individual cards were observed in this proof. Long inputs, different page sizes, print scales, font rendering, or browser engines may paginate differently. Do not claim native printer compatibility or complete server-side report/PDF export validation from this result.

## 6. Evidence files

Directory: `validation/results/college-showcase-audit/`.

- `browser-validation.json` — final 19 checks, demo counts, expected error, and browser version; run timestamp `2026-09-09T23:34:40.231Z`.
- `showcase-input-desktop.png` and `product-report-desktop.png` — desktop UI proof.
- `showcase-mobile.png` and `showcase-mobile-first-screen.png` — mobile proof.
- `synthetic-showcase-report.md` — actual downloaded full-record Markdown.
- `synthetic-showcase-print.pdf` — final four-page A4 proof.
- `print-page-1.png` through `print-page-4.png` — rendered pages inspected for pagination.

Only synthetic inputs and isolated browser storage were used. No personal browser profile was accessed. Source/build command results were observed in the verification run; this report does not imply separate machine-readable logs exist for every command.

## 7. Manual handoff and claim boundaries

- [ ] Rehearse all three demos and one pasted example on the presentation laptop/projector.
- [ ] Use the same origin, `http://127.0.0.1:3000/showcase`, when testing refresh/storage.
- [ ] Open native Print / Save PDF, inspect A4 preview, save a copy, and optionally print it.
- [ ] Keep the generated synthetic PDF/Markdown/screenshots available as a backup.
- [ ] Explain that rule scores are uncalibrated, neutral may mean no recognized cues, and flags require human review.

No local showcase regression blocker remains in the tested scope. **Showcase-ready and resume-ready with the stated limits; not evidence of full production readiness.** The historical six-of-nine system-readiness status and its Supabase/API, cross-tenant, and full export gaps remain separate. Benchmark numbers were not changed or rerun. See [FINAL_AUDIT_AND_VALIDATION_REPORT.md](FINAL_AUDIT_AND_VALIDATION_REPORT.md) for the prior unresolved benchmark-ID provenance issue, broader deferred risks, exact demo command, and scoped staging suggestion.
