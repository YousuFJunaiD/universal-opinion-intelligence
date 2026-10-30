# Reliable college demonstration

From the project folder:

```bash
npm run demo
```

Open the URL printed after **READY: HTTP 200 and showcase content verified**, normally `http://127.0.0.1:3000/showcase`. Keep the terminal open. No PostgreSQL, Supabase, FastAPI, paid API or `.env` setup is required for this route.

## Before the presentation

1. Keep the project source (`src/`, `public/` and build configuration) downloaded.
2. Run `npm run demo:prepare` while online. It tries npm's offline cache first, but initial preparation may need internet.
3. Run `npm run demo`, load Product Reviews Demo, and click Run Analysis.
4. Confirm counts, evidence and review-quality flags; download Markdown and use Print / Save PDF. Repeat with Brand Feedback Demo and Public Figure Comments Demo.
5. Save a report before travelling as an additional static presentation aid. The print output is browser-generated, not a server-side PDF service.
6. Copy the **Offline rescue command** printed during preparation into presentation notes.

## During the presentation

- Use `npm run demo:cached` if source/cloud access is slow. It runs the previous prepared build without source copying, install or compilation; later edits are not included.
- If the Desktop folder itself cannot be read, run the printed rescue command: `node "<local-cache>/start-demo.cjs"`. On macOS this script and the prepared runtime live in `~/Library/Caches/universal-opinion-intelligence/<workspace-id>/`.
- The server binds only to loopback. If port 3000 is occupied it tries the next ten ports. Always use the printed URL. To choose a starting port: `npm run demo -- --port 3100`.
- Keep the local server running. Browser refresh requires that local server, not an internet connection. A loaded page can analyze and export with browser networking disabled; bundled CSV buttons normally read from the local server.
- If the operating system removed the prepared cache, preparation must be repeated. Do not discover this at the venue: rehearse the fallback before travelling.
- Ctrl+C stops this launcher and its server, not other applications.

## Honest demonstration scope

`/showcase` uses a deterministic browser-local sentiment engine, not the research RoBERTa model. Do not attach historical benchmark accuracy to its predictions. Quality flags request manual review; they do not prove deception. The demo supports pasted text and CSV, counts and evidence, keyword grouping, a browser-saved report and exports. It does not need external scraping, cloud databases or transformer downloads.

Local demo limits remain 250 records, 250,000 input characters and 5,000 characters per record. Use synthetic or appropriately authorized anonymous data. Browser storage is per origin/port, so a report saved at one port is not automatically available at another.

## Why startup was repaired this way

The affected Desktop dependency tree contained macOS `dataless` (offloaded) files. A sample of the hung Next.js process showed synchronous filesystem reads; `/showcase` timed out even after the process reached Starting. Changing ports, Node versions or `.next` did not make missing dependency bytes resident.

The launcher leaves the original checkout intact. It snapshots only application sources, public assets and configuration into a local OS cache, installs the locked dependencies there, builds once, and reuses a matching production build. It does not copy `.env`, private datasets, historical reports or research archives. Source and lockfile hashes select the build; platform, architecture and Node major version also separate builds. It checks HTTP content, not just a startup message.

`npm run dev` uses the same approach with source watching. Use `npm run dev:direct` for intentionally configured backend development in a fully downloaded checkout outside cloud storage. The demo/dev wrapper deliberately ignores service credentials. Production deployment commands (`build`, `start`) are unchanged. This repair does not alter macOS/iCloud settings or re-enable offloaded Desktop dependencies.

See [installation details](docs/INSTALLATION_GUIDE.md) and [verification evidence](docs/STARTUP_RECOVERY_REPORT.md).
