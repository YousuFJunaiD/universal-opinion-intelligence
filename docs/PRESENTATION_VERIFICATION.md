# Presentation experience and cached launch verification

Date: 2026-10-30. Scope: local college demonstration, not research-model evaluation or production readiness. Synthetic data only. No benchmark experiments were rerun.

## User procedures

After code/source changes, from the project root:

```bash
npm run demo:prepare
```

Wait for `PREPARED AND HTTP VERIFIED`. Then double-click **Launch Opinion Intelligence.command** in Finder. It starts the latest selected HTTP-verified prepared build, opens `/showcase`, and keeps its terminal open. Repeat launch reuses the matching live server. The same file is also prepared in `~/Library/Caches/universal-opinion-intelligence/<workspace-id>/` as a non-cloud fallback. Do not move the project launcher alone to another directory; use an alias or the cache copy.

`npm run demo` and `npm run demo:cached` are both cached-only; `-- --open` opens the browser. They do not install dependencies, download packages, hydrate/copy source or compile. Preparation is explicit and can require internet if dependencies are not cached. Missing/unverified/incompatible builds fail with instructions and a saved-report fallback, rather than initiating preparation. Preparation promotes its selection only after build and HTTP checks and cache-launcher writes succeed.

Freshness uses a bounded **metadata-only** worker. Changed/added/removed application inputs report STALE. Missing/timed-out metadata reports UNKNOWN, never “current.” Unchanged metadata is explicitly not a new content-hash verification. Original source bytes are not read during launch. Cache removal, missing Node or unavailable application assets still require preparation/recovery; this is not an unconditional offline availability guarantee.

## Presentation behavior

- Presentation Mode defaults on. Real input validation, sentiment classification, review-quality checks, keyword/evidence summaries and report/recommendation construction execute in that order.
- Five two-second pauses provide **intentional presentation pacing**, not fabricated compute time. Background-tab throttling or a busy machine can extend elapsed time.
- Fast Mode runs identical analytical operations without deliberate pauses. Counts and evidence are calculated from the supplied records.
- Actual engine: `browser-rule-based-showcase`, version 1.1.0. No browser RoBERTa inference, fake network requests or invented prediction probabilities.
- Quality flags request manual review, not confirmed deception. Rule scores remain uncalibrated heuristics. Keyword groups are lexical matches, not learned topics.
- Input errors are immediate. Abort controllers and operation tokens protect reset, cancel, edits, dataset/file changes, unmount/navigation and repeat clicks. Interrupted runs cannot overwrite newer reports. Saving is attempted only after the final stage; browser-storage failures retain export capability.
- Pipeline controls are `no-print`. Existing report renderers and print CSS are unchanged by this presentation implementation. Markdown/JSON/export and CSV-reading buttons have no new artificial delays.

## Fresh verification results

Environment: macOS ARM64, Node.js 24.11.1, npm 11.6.2, Next.js 15.5.18; installed Chrome controlled using Playwright. The current app is built from a source snapshot in the previously repaired non-cloud runtime. Private `.env` files and production services are not used.

| Suite/check | Result |
| --- | --- |
| Full production build | PASS, 26 static pages, integrated type/lint checks passed |
| Explicit TypeScript check | PASS |
| Explicit lint | PASS; existing Next.js future `next lint` deprecation notice only |
| Launcher unit/integration regressions | 13 PASS, 0 FAIL |
| Existing showcase input checks | 17 PASS, 0 FAIL |
| Existing synthetic local-feedback infrastructure checks | 13 PASS, 0 FAIL |
| Existing full showcase browser suite | 19 PASS, 0 FAIL |
| Existing college CSV/offline browser suite | 5 PASS, 0 FAIL |
| New presentation browser suite, production | 12 PASS, 0 FAIL |
| New presentation browser suite, development | 12 PASS, 0 FAIL |

Total across these suites: **91 PASS, 0 FAIL**. Build/lint/type checks and launcher observations are separate, not inflated into this total. The new suite tests real wall-clock pacing, identical Fast Mode outputs, prompt invalid-input handling, repeat clicks, cancellation, newer-run protection, dataset changes, CSV upload, report restoration, Markdown/JSON, browser print, reset, unmount and offline browser analysis/export. Interruption cases use controlled browser time; those are not reported as measured performance runs.

An independent publication-candidate copy (committed baseline plus only selected showcase/launcher changes) also passed a production build, HTTP readiness and **12/12 presentation browser checks**. Evidence is in `/private/tmp/uoip-presentation-commit-candidate-20261030/`. Those additional checks bring the total to **103 PASS, 0 FAIL** across separately identified runs; they are not independent research samples. Existing unrelated API/ML/style edits were excluded from this candidate.

| Measured observation | Result |
| --- | --- |
| Production paced analysis | 10,504 ms |
| Development paced analysis | 10,515 ms |
| Production Fast Mode | 38 ms |
| Development Fast Mode | 81 ms |
| Production invalid CSV rejection | 28 ms |
| Development invalid CSV rejection | 36 ms |
| Cold-process double-click launcher → HTTP-ready | 628 ms |
| Repeat double-click, matching server reuse | 26 ms |
| Cold-process launch with external networking denied | 492 ms |

These are single observed runs, not performance guarantees or statistically repeated measurements. Cold process means no matching prepared-demo process was running; it does not mean the OS disk cache was purged.

Offline launch was tested with a macOS sandbox denying external outbound connections while permitting loopback. The policy was first checked using an external TCP attempt, which failed with EPERM. The actual double-click script then launched the prepared server and verified HTTP 200 with no installation/build. This did not disable the user's machine-wide networking. Browser tests separately blocked external origins and exercised analysis/export with the browser offline. All relevant browser suites recorded zero external-service/API requests and no unexpected page errors.

Port conflicts were exercised: occupied lower ports remained untouched and the launcher used port 3002. Unit tests also verify port selection without stopping the owner. Missing-build recovery was tested with a separate synthetic launcher location: clear error, preparation instruction, static-report fallback and nonzero exit, with no install/download attempt. Freshness tests verify unchanged, edited, added and inaccessible source cases without source-content reads. A verified prepared build is retained during explicit preparation.

The active pipeline was visually inspected. The new synthetic browser-print report has three nonblank pages (858, 1,313 and 985 extracted characters), no pipeline controls, and intact evidence, engine metadata and limitations. All three pages were visually reviewed. This is **browser-print output**, not server-side PDF generation.

## Evidence and preservation

Fresh evidence directories (local, temporary, not publication archives):

- `/private/tmp/uoip-presentation-production-20261030/`
- `/private/tmp/uoip-presentation-development-20261030/`
- `/private/tmp/uoip-presentation-local-feedback-20261030/`
- Full existing showcase suite: the fresh `uoip-showcase-*` temporary directory printed by that test.

No historical evidence directory was used for these runs. Existing browser scripts use their output overrides/fresh temporary directories. All **22/22** historical-result hashes matched their existing preservation manifest. No research conclusion, dataset, author metadata or release archive was regenerated or edited. The earlier startup-run incident affecting five historical UI/export files remains documented in `STARTUP_RECOVERY_REPORT.md`; this task does not claim those older files were recovered.

The commit scope is launcher/presentation code, its verification and documentation. Current relevant showcase CSV aliases, lexical theme groups and JSON-export functionality are retained, not replaced. Unrelated ML, API, database, research, manuscript, README history and report-style work remains outside the scoped commit.
