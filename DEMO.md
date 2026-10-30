# Reliable college demonstration

## Prepare explicitly, then double-click

After source changes, run once from the project folder (internet may be needed only for missing dependencies):

```bash
npm run demo:prepare
```

Wait for **PREPARED AND HTTP VERIFIED**. Preparation builds the app, checks `/showcase` over loopback HTTP, then promotes that build. A failed build/check leaves the previous verified selection available.

For the presentation, double-click **Launch Opinion Intelligence.command** in Finder. It opens the browser directly at the verified `/showcase` URL. Leave its terminal window open. A repeat double-click reopens the matching running demo rather than creating another copy. The same launcher is copied into the non-cloud cache during preparation for use if Desktop access is unavailable.

Alternatively, from the project folder:

```bash
npm run demo
```

Both `npm run demo` and `npm run demo:cached` are now **strictly cached-only**. They never install, download dependencies, copy/hydrate source or compile. Add `-- --open` to open the browser automatically. Missing/incompatible cached builds produce an explicit error and preparation instructions, not an automatic repair/install. No PostgreSQL, Supabase, FastAPI, paid API or `.env` setup is required.

The launcher reports the preparation/HTTP-verification dates. A bounded, metadata-only check detects changed/added/removed application files. **STALE** means the cached build excludes later source edits; run `demo:prepare` when you want those changes. **UNKNOWN** means metadata could not be checked; it is not claimed current. Unchanged metadata is not a fresh content-hash verification: no source contents are read during a presentation launch. An unavailable metadata check does not block the cached demo.

## Before the presentation

1. Keep the project source (`src/`, `public/` and build configuration) downloaded.
2. Run `npm run demo:prepare` while online. It tries npm's offline cache first, but initial preparation may need internet.
3. Run `npm run demo`, load Product Reviews Demo, and click Run Analysis.
4. Confirm counts, evidence and review-quality flags; download Markdown and use Print / Save PDF. Repeat with Brand Feedback Demo and Public Figure Comments Demo.
5. Save a report before travelling as an additional static presentation aid. The print output is browser-generated, not a server-side PDF service.
6. Copy the **Offline rescue command** printed during preparation into presentation notes.

## During the presentation

- Use `npm run demo` or `npm run demo:cached`; both run the latest HTTP-verified prepared build, without source copying, install or compilation. Later source edits are not included until explicit preparation.
- If Desktop cannot be read, double-click the **cache-resident** `Launch Opinion Intelligence.command`, or run `node "<local-cache>/start-demo.cjs" --open`. These files live in `~/Library/Caches/universal-opinion-intelligence/<workspace-id>/`. Do not move the project launcher alone elsewhere; use a Finder alias or the prepared cache copy.
- The server binds only to loopback. If port 3000 is occupied it tries the next ten ports. Always use the printed URL. To choose a starting port: `npm run demo -- --port 3100`.
- Keep the local server running. Browser refresh requires that local server, not an internet connection. A loaded page can analyze and export with browser networking disabled; bundled CSV buttons normally read from the local server.
- If the operating system removed the prepared cache, preparation must be repeated. Do not discover this at the venue: rehearse the fallback before travelling.
- Ctrl+C stops this launcher and its server, not other applications.

## Honest demonstration scope

Presentation Mode is enabled by default. Five stages execute the existing input validation, sentiment classification, quality checks, theme/evidence summary and report/recommendation algorithms, with two seconds of deliberate pacing at each stage (about ten seconds total). This is explicitly **presentation pacing, not compute time**. Counts come from those algorithms. Uncheck Presentation Mode for Fast Mode: identical algorithms, no deliberate pause.

Input errors appear immediately. Cancel, reset, edits, dataset/CSV changes and navigation cancel pending work. A previous completed report remains visible until a newer run completes successfully; an interrupted run cannot save over it. CSV reading, file exports and browser printing have no added presentation delay.

`/showcase` uses a deterministic browser-local sentiment engine, not the research RoBERTa model. Do not attach historical benchmark accuracy to its predictions. Quality flags request manual review; they do not prove deception. The demo supports pasted text and CSV, counts and evidence, keyword grouping, a browser-saved report and exports. It does not need external scraping, cloud databases or transformer downloads.

Local demo limits remain 250 records, 250,000 input characters and 5,000 characters per record. Use synthetic or appropriately authorized anonymous data. Browser storage is per origin/port, so a report saved at one port is not automatically available at another.

## Why startup was repaired this way

The affected Desktop dependency tree contained macOS `dataless` (offloaded) files. A sample of the hung Next.js process showed synchronous filesystem reads; `/showcase` timed out even after the process reached Starting. Changing ports, Node versions or `.next` did not make missing dependency bytes resident.

During **explicit preparation**, the launcher snapshots only application sources, public assets and configuration into a local OS cache, installs locked dependencies there, builds once, and reuses a matching production build. It does not copy `.env`, private datasets, historical reports or research archives. Source and lockfile hashes select the build; platform, architecture and Node major version also separate builds. It checks HTTP content, not just a startup message. Normal/cached presentation launch never runs preparation.

`npm run dev` uses the same approach with source watching. Use `npm run dev:direct` for intentionally configured backend development in a fully downloaded checkout outside cloud storage. The demo/dev wrapper deliberately ignores service credentials. Production deployment commands (`build`, `start`) are unchanged. This repair does not alter macOS/iCloud settings or re-enable offloaded Desktop dependencies.

See [installation details](docs/INSTALLATION_GUIDE.md), [startup repair history](docs/STARTUP_RECOVERY_REPORT.md), and [presentation verification](docs/PRESENTATION_VERIFICATION.md).
