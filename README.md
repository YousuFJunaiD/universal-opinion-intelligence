# Universal Opinion Intelligence Platform

Universal Opinion Intelligence Platform is an enterprise-grade opinion intelligence system for transforming unstructured public and private text feedback into structured insights, reports, and decision-ready recommendations.

The platform is built as a chat-first SaaS product: users describe a topic, brand, product, profile, campaign, website, or custom dataset, then the system guides them through data collection, cleaning, sentiment analysis, multi-dimensional analysis, recommendations, report generation, benchmark evaluation, and PDF export.

## Product Positioning

Universal Opinion Intelligence Platform is designed for teams that need transparent, evidence-backed opinion analysis across:

- social media comments and public reactions
- product and app reviews
- brand feedback and campaign response
- survey responses and support tickets
- public opinion and issue-based discussions
- creator, profile, or public figure audience response
- custom text datasets

It is not a hidden-data scraper. The platform analyses only user-provided records, uploaded CSV rows, or publicly accessible web pages discovered through configured search providers.

## Key Capabilities

- Conversational research-to-report wizard.
- Manual text and CSV dataset intake.
- Public URL extraction for accessible HTML pages.
- Brave Search provider integration for public source discovery.
- Disabled search provider fallback with clear limitations.
- Dataset cleaning and preparation summary.
- Rule-based sentiment baseline.
- FastAPI ML adapter with VADER sentiment baseline.
- Multi-dimensional analysis for emotion, stance, aspects, and risk signals.
- Evidence-based recommendation and action roadmap generation.
- Report snapshot generation with source lists and access limitations.
- Browser print/PDF export.
- Benchmark evaluation metrics from labelled user-provided datasets.
- Local, API-shadow, and API/PostgreSQL data modes.
- Supabase Auth-ready user ownership.
- Workspace, role, and shared-project structure.

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js App Router, React, TypeScript |
| Styling | Tailwind CSS, local shadcn-style UI primitives |
| API layer | Next.js Route Handlers |
| Local persistence | Browser localStorage repositories |
| Database-ready persistence | PostgreSQL/Supabase repositories |
| Authentication | Dev auth fallback and Supabase Auth utilities |
| ML service | FastAPI |
| ML baseline | VADER via `vaderSentiment` |
| Search provider | Brave Search API first; disabled default |
| Reporting | React report snapshots and browser print/PDF |
| Evaluation | Accuracy, precision, recall, F1, confusion matrix |

## Repository Structure

```text
.
├── docs/                         # Final project documentation package
├── ml-service/                   # FastAPI ML service
├── src/
│   ├── app/                      # Next.js App Router pages and API routes
│   ├── components/               # UI and dashboard components
│   ├── lib/                      # Services, repositories, API client, research providers
│   ├── server/                   # Auth, Supabase, database client, migrations
│   └── types/                    # Shared TypeScript contracts
├── package.json
└── README.md
```

## Local Setup

Install dependencies:

```bash
npm install
```

Run the Next.js app in localStorage mode:

```bash
NEXT_PUBLIC_DATA_MODE=local npm run dev
```

Open:

```text
http://localhost:3000
```

## Environment Variables

Create `.env.local` for local development. Do not commit secrets.

```bash
NEXT_PUBLIC_DATA_MODE=local
DATA_ACCESS_MODE=local
AUTH_MODE=dev

DATABASE_URL=
PGSSLMODE=require

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DEV_USER_ID=00000000-0000-4000-8000-000000000001
DEV_USER_EMAIL=dev@uoip.local

ANALYSIS_PROVIDER=rule-based
FASTAPI_ML_URL=

SEARCH_PROVIDER=disabled
BRAVE_SEARCH_API_KEY=
SERPAPI_API_KEY=
TAVILY_API_KEY=
```

## Data Modes

| Mode | Description |
| --- | --- |
| `NEXT_PUBLIC_DATA_MODE=local` | Browser localStorage is the source of truth |
| `NEXT_PUBLIC_DATA_MODE=api-shadow` | localStorage remains source of truth while API calls run in parallel |
| `NEXT_PUBLIC_DATA_MODE=api` | API routes and PostgreSQL repositories are source of truth |

Server-side repository mode:

```bash
DATA_ACCESS_MODE=local
DATA_ACCESS_MODE=postgres
```

## Supabase Setup

1. Create a Supabase project.
2. Open the Supabase SQL Editor.
3. Apply migrations in numeric order from `src/server/db/migrations/`:
   - `0001_init.sql`
   - `0002_auth_user_scope.sql`
   - `0003_workspaces_roles.sql`
   - `0004_model_metadata.sql`
4. Copy the pooled database connection string into `DATABASE_URL`.
5. Set `PGSSLMODE=require` if your hosting environment requires SSL.
6. Enable email/password auth in Supabase Authentication.
7. Set:

```bash
AUTH_MODE=supabase
NEXT_PUBLIC_DATA_MODE=api
DATA_ACCESS_MODE=postgres
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
DATABASE_URL=...
```

## Database Migrations

The database schema is PostgreSQL/Supabase-ready:

- `users`
- `projects`
- `datasets`
- `dataset_records`
- `prepared_datasets`
- `analysis_jobs`
- `sentiment_results`
- `deep_analysis_results`
- `recommendations`
- `report_snapshots`
- `report_exports`
- `workspaces`
- `workspace_members`
- model metadata columns

Complex analysis payloads are stored as JSONB so early production workflows can evolve without repeated relational migrations.

## FastAPI ML Service Setup

The ML service lives in `ml-service/`.

```bash
cd ml-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Health check:

```bash
curl http://127.0.0.1:8000/health
```

Connect Next.js to FastAPI:

```bash
ANALYSIS_PROVIDER=fastapi FASTAPI_ML_URL=http://127.0.0.1:8000 npm run dev
```

If the FastAPI service is unavailable, the Next.js app falls back to the local rule-based baseline and records fallback metadata.

## Tavily / Brave Search Provider Setup

Public research search is disabled by default.

```bash
SEARCH_PROVIDER=disabled
```

Enable Brave Search:

```bash
SEARCH_PROVIDER=brave
BRAVE_SEARCH_API_KEY=your_brave_key
```

Run:

```bash
SEARCH_PROVIDER=brave BRAVE_SEARCH_API_KEY=your_brave_key npm run dev
```

Supported provider values:

```bash
SEARCH_PROVIDER=disabled
SEARCH_PROVIDER=brave
SEARCH_PROVIDER=serpapi
SEARCH_PROVIDER=tavily
SEARCH_PROVIDER=custom
```

Current implementation:

- `brave`: implemented using Brave Search API.
- `disabled`: default safe provider.
- `serpapi`, `tavily`, `custom`: adapter placeholders for future implementation.

The public research flow uses only discovered public URLs and accessible extracted page text. It does not bypass login, CAPTCHA, robots-restricted private areas, hidden comments, or private platform data.

## Testing Commands

Run the frontend checks:

```bash
npm run typecheck
npm run lint
npm run build
```

Check FastAPI syntax:

```bash
python3 -m py_compile ml-service/main.py
```

Test FastAPI sentiment:

```bash
curl -X POST http://127.0.0.1:8000/analyze/sentiment \
  -H 'content-type: application/json' \
  -d '{"records":[{"id":"r1","text":"The product is excellent."},{"id":"r2","text":"The app is slow and broken."}]}'
```

Test benchmark evaluation:

```bash
curl -X POST http://127.0.0.1:3000/api/evaluation/run \
  -H 'content-type: application/json' \
  -d '{"dataset":{"id":"bench-1","name":"Benchmark","createdAt":"2026-06-05T00:00:00.000Z","sourceType":"paste","records":[{"id":"r1","text":"The product is excellent","expectedSentiment":"positive"},{"id":"r2","text":"The app is broken","expectedSentiment":"negative"}]}}'
```

## Deployment Notes

### Next.js

Deploy the Next.js app to Vercel or another Node-capable platform.

Recommended production setup:

- `NEXT_PUBLIC_DATA_MODE=api`
- `DATA_ACCESS_MODE=postgres`
- `AUTH_MODE=supabase`
- `DATABASE_URL` configured
- Supabase Auth configured
- migrations applied before first production use

### FastAPI

Deploy `ml-service/` separately to a Python-capable host such as Render, Railway, Fly.io, Azure App Service, or a VM.

Production command:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

Set the deployed URL in Next.js:

```bash
ANALYSIS_PROVIDER=fastapi
FASTAPI_ML_URL=https://your-ml-service.example.com
```

### Search

Configure Brave Search API in the deployment environment:

```bash
SEARCH_PROVIDER=brave
BRAVE_SEARCH_API_KEY=...
```

Keep search disabled in environments where public research discovery is not approved.

## Current Limitations

- No private or login-protected data access.
- No hidden comment extraction.
- No illegal scraping or CAPTCHA bypass.
- Social platform APIs are not implemented.
- JavaScript-rendered pages may extract limited text.
- Current sentiment baselines are lexical/rule-based, not transformer-grade.
- VADER is English-oriented and can struggle with multilingual text, sarcasm, slang, and domain-specific phrasing.
- Toxicity, spam, bot, and coordinated-campaign detection are not production classifiers yet.
- SerpAPI, Tavily, and custom search adapters are placeholders.
- Browser print is used for PDF export; no server-side PDF renderer is included.

## Future Roadmap

- Add Tavily and SerpAPI providers.
- Add official social/review platform API connectors.
- Add queue-based background jobs for large research runs.
- Add multilingual language detection and model routing.
- Add transformer models such as BERT, RoBERTa, or DistilBERT.
- Add toxicity, spam, bot, and misinformation risk classifiers.
- Add human-in-the-loop label correction for benchmark datasets.
- Add model comparison reports across benchmark runs.
- Add server-side PDF rendering.
- Add production audit logs, tracing, metrics dashboards, and alerting.
- Add enterprise workspace invitations and admin governance.
