# Startup repair and verification — 2026-10-30

## Outcome

The current worktree application was actually built, launched and exercised in Chrome. `npm run demo` reaches Next.js Ready and HTTP 200 with showcase content. The local-only demonstration needs no PostgreSQL, Supabase, FastAPI or paid service. See [presentation instructions](../DEMO.md).

This is application verification, not a research experiment or a change to sentiment benchmark results. The full current-worktree browser tests ran against a byte-copied, secret-free source snapshot outside cloud storage. A separate export of committed application code plus the startup changes was also built and browser-tested; existing unrelated application/research edits were not bundled into that candidate.

## Confirmed causes

1. **Cloud-backed filesystem reads stalled startup.** The macOS Desktop `node_modules` tree contains offloaded `dataless` files; for example `next/dist/compiled/babel/bundle.js` was `compressed,dataless`. Sampling the stalled Next.js process found 2,376 of 2,377 main-thread samples in filesystem `read`, through `node::fs::ReadFileUtf8` and `uv_fs_read`. The process had a Next.js source-map file open. Even after it reached Starting, an 8-second `/showcase` request timed out with HTTP 000. Switching ports or deleting a compilation cache does not hydrate dependency files.
2. **The committed lockfile was not installable with the current npm.** A clean candidate initially failed `npm ci` with an inconsistent `@emnapi/wasi-threads` entry and missing nested `@emnapi/core`, `@emnapi/runtime` and `@emnapi/wasi-threads` entries. The user's preceding successful `npm install` had already repaired these entries. That reviewed 40-line lockfile diff is included in the fix without further edits; application package versions are not upgraded.
3. The old TypeScript include glob covered every TypeScript file in the repository, including scratch/research trees. It was narrowed to application source and Next-generated types. This is a scope correction, not asserted to be the primary filesystem stall.

## Repair

- Built-in-Node launcher; no extra runtime dependency.
- Copy only `src/`, `public/` and known build configuration into the OS-local cache, not Desktop/iCloud.
- Install pinned dependencies separately from the offloaded original `node_modules`; include build-time dependencies and disable package lifecycle scripts. Try npm cache first, then the registry if needed. Initial setup can require internet.
- Source/config/lockfile hashes and runtime platform/architecture/Node major identify production builds. An existing matching successful build is reused.
- Local environment allowlist; no `.env` copy, inherited credentials or `NODE_OPTIONS` hooks. Loopback binding only; no backend or paid service for showcase.
- `demo:prepare`, `demo`, `demo:cached`, and a standalone cache-resident rescue script. Readiness means HTTP 200 **and** showcase content, not merely a process or open port.
- `dev` uses a source-watched local snapshot. `dev:direct` preserves original Next.js behavior for intentionally configured service development. `build` and `start` remain unchanged.
- Preparation timeout, source-symlink rejection, dead-owner lock recovery, port-conflict fallback, and child-process cleanup. Only launcher-owned processes/cache files are managed.

## Fresh verification

Environment: macOS ARM64; Node.js 24.11.1; npm 11.6.2; Next.js 15.5.18; installed Chrome 156.0.8078.79, controlled using the available Playwright runtime. No browser profile belonging to the user was used. All browser datasets were synthetic.

| Check | Fresh result | Scope/evidence |
| --- | --- | --- |
| Production build | PASS | Entire current app compiled; 26 static pages generated; integrated type/lint checks passed |
| Explicit `npm run typecheck` | PASS | Exact app snapshot using resident dependencies |
| Explicit `npm run lint` | PASS | No ESLint warnings/errors; Next.js reports its existing future `next lint` deprecation |
| Launcher regressions | 10 PASS, 0 FAIL | `validation/demo_launcher_test.cjs`: argument validation, env isolation, snapshot scope, symlinks, missing lockfile, live/dead locks, ports and HTTP readiness |
| Input/quality regressions | 17 PASS, 0 FAIL | Existing `validation/showcase_input_test.cjs`, run in original workspace |
| Local-feedback infrastructure | 13 PASS, 0 FAIL | Existing synthetic `validation/local-feedback/local_feedback_test.cjs`, original workspace; not genuine local validation |
| Full showcase browser suite | 19 PASS, 0 FAIL | Current worktree snapshot: all three 15-row demos, CSV ingestion, flags, sentiment, report persistence, Markdown, print, malformed input, storage failures, mobile layout and zero unexpected browser errors |
| College/offline browser suite | 5 PASS, 0 FAIL | CSV schema, no human-label leakage, keyword groups, report identity restoration, JSON/Markdown/print and analysis/export while browser offline |
| External dependency requests | 0 external requests; 0 API calls | Both current-worktree browser suites |
| `npm run dev` | PASS | Next Ready in 1,209 ms; `/showcase` HTTP 200; temporary synthetic public-file creation/update/removal synchronized correctly; temporary file removed |
| `npm run demo` | PASS | Next Ready in 250 ms in first recorded launch; HTTP 200 verified |
| `npm run demo:cached` | PASS | Ready in 409 ms; HTTP 200; no source copy/install/compile |
| Standalone rescue script | PASS | Ready in 332 ms; HTTP 200; launched directly from non-cloud cache |
| Clean publication candidate | Build PASS; 19 browser PASS, 0 FAIL | Committed source + only startup/config/lockfile repairs, independent cache; Ready in 352 ms and HTTP 200 |

Current-worktree automated suites total **64 PASS, 0 FAIL**; the independent committed-baseline browser suite adds **19 PASS, 0 FAIL**. Build/type/lint/launcher startup observations are listed separately, not counted as additional unit tests. Startup times are observations, not performance guarantees.

Initial test harness issues were resolved: the bundled Playwright browser version was not installed, so verification used the installed Chrome; a sandbox-denied TypeScript incremental-cache write was rerun with local-cache write permission and passed. Neither was an application failure.

Browser-print artifacts were checked using the PDF inspection workflow. The synthetic product report has four nonblank pages; the college report has three. All seven rendered pages were visually inspected: readable text, intact evidence and limitations, no clipped text or trailing blank pages. Print output is browser-generated; no server-side PDF capability is asserted.

Fresh evidence is at `/private/tmp/uoip-startup-verification/` (local temporary artifacts, not a release archive). Subfolders `showcase`, `local-feedback`, and `clean-baseline` distinguish the runs. The original blocked-process sample is `/private/tmp/opinion-startup-sample.txt`. Successful-build manifests in the printed runtime cache record source/config hashes. Original Desktop `next dev` was not claimed repaired in place: the verified entry points bypass the offloaded dependency tree.

## Preservation incident — explicit exception

The independent baseline browser script from the previous commit did **not** support `SHOWCASE_TEST_OUTPUT_DIR`. It wrote seven files to its historical hard-coded directory, `validation/results/college-showcase-audit/`, before this mismatch was detected. This was a verification mistake, not an intended evidence update. The fresh outputs were copied to `clean-baseline` above.

Two originals were restored from backups and checked against the existing protected-file SHA-256 manifest:

- `browser-validation.json` from the research-strengthening baseline backup;
- `showcase-mobile-first-screen.png` from a matching KSCST evidence copy.

Five historical UI/export files could not be recovered from the local backups searched and currently contain the new baseline-run output:

- `product-report-desktop.png`
- `showcase-input-desktop.png`
- `showcase-mobile.png`
- `synthetic-showcase-print.pdf`
- `synthetic-showcase-report.md`

They must **not** be represented as preserved historical evidence or associated with the restored older JSON's date. The four original `print-page-*.png` files remain intact. No Time Machine local snapshot was available. Restoring these five originals requires an external/older backup; they are excluded from the startup commit. This exception prevents claiming that every historical report/artifact was preserved.

Verification against the existing protected manifest found **625/630 validation files matching**, with exactly the five UI/export differences above and no missing validation files. A separate historical-result manifest check found **22/22 hashes matching**. No benchmark data, metrics, experiment results or research conclusions were changed. No research experiment or manuscript/release regeneration was performed. Other pre-existing uncommitted work remains in the worktree. The reviewed install-consistency lockfile repair is deliberately included in the startup commit.

To prevent a repeat, the browser script now preserves its existing output-directory override and defaults to a fresh OS-temporary directory, printing that path. This small verification-safety fix is also included in the startup commit. It does not modify application behavior.

## Remaining boundaries

- This verifies the offline showcase, not production readiness, hosted deployment, backend authorization, external collection or RoBERTa quality.
- The OS may remove cache files. Prepare and rehearse before travelling; keep a saved static report as an additional fallback.
- Source edits require readable/downloaded source for rebuilding. `demo:cached` intentionally uses the last prepared build.
- A running local server is required for navigation/reload. There is no new service worker or standalone browser installation.
- Only macOS ARM64 was exercised; other platforms are not claimed verified.
- Existing pending application/research changes are not silently published. The clean-candidate test establishes the startup fix independently of them.
