# Universal Opinion Intelligence Platform: Installation Guide

## 1. Prerequisites

Install the following:

- Node.js 18 or newer
- npm
- Python 3.10 or newer
- PostgreSQL or Supabase project for API mode
- Git, if cloning from a repository

The application can run without PostgreSQL in local mode.

## 2. Project Structure

```text
.
├── README.md
├── docs/
├── ml-service/
│   ├── main.py
│   ├── requirements.txt
│   └── README.md
├── src/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── server/
│   └── types/
└── package.json
```

## 3. Install Next.js Dependencies

From the project root:

```bash
npm install
```

## 4. Run the Next.js App in Local Mode

```bash
NEXT_PUBLIC_DATA_MODE=local npm run dev
```

Open:

```text
http://localhost:3000
```

If port 3000 is occupied, Next.js may choose another port.

## 5. Run the FastAPI ML Service

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

## 6. Connect Next.js to FastAPI

Run the Next.js app with:

```bash
ANALYSIS_PROVIDER=fastapi FASTAPI_ML_URL=http://127.0.0.1:8000 npm run dev
```

If FastAPI is unavailable, the app falls back to the deterministic rule-based engine and records fallback metadata.

## 7. Environment Variables Guide

### Data Mode

| Variable | Values | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_DATA_MODE` | `local`, `api-shadow`, `api` | Frontend data source mode |
| `DATA_ACCESS_MODE` | `local`, `postgres` | Server repository mode override |

Recommended default:

```bash
NEXT_PUBLIC_DATA_MODE=local
```

### Authentication

| Variable | Purpose |
| --- | --- |
| `AUTH_MODE=dev` | Use development user fallback |
| `AUTH_MODE=supabase` | Use Supabase Auth sessions |
| `DEV_USER_ID` | Development user UUID for API mode |
| `DEV_USER_EMAIL` | Development user email |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Reserved for future server-only admin operations |

Development auth example:

```bash
AUTH_MODE=dev DEV_USER_ID=00000000-0000-4000-8000-000000000001 DEV_USER_EMAIL=dev@uoip.local npm run dev
```

Supabase auth example:

```bash
AUTH_MODE=supabase NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... npm run dev
```

### Database

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL/Supabase connection string |
| `PGSSLMODE=require` | SSL hint for hosted PostgreSQL |

API/PostgreSQL mode example:

```bash
NEXT_PUBLIC_DATA_MODE=api DATA_ACCESS_MODE=postgres DATABASE_URL=... npm run dev
```

### ML Provider

| Variable | Values | Purpose |
| --- | --- | --- |
| `ANALYSIS_PROVIDER` | `rule-based`, `fastapi`, `azure` | Select sentiment provider |
| `FASTAPI_ML_URL` | URL | Base URL of FastAPI ML service |

FastAPI example:

```bash
ANALYSIS_PROVIDER=fastapi FASTAPI_ML_URL=http://127.0.0.1:8000 npm run dev
```

### Public Search Provider

| Variable | Values | Purpose |
| --- | --- | --- |
| `SEARCH_PROVIDER` | `disabled`, `brave`, `serpapi`, `tavily`, `custom` | Select public search provider |
| `BRAVE_SEARCH_API_KEY` | string | Brave Search API key |
| `SERPAPI_API_KEY` | string | Reserved for future SerpAPI adapter |
| `TAVILY_API_KEY` | string | Reserved for future Tavily adapter |

Default:

```bash
SEARCH_PROVIDER=disabled
```

Brave Search example:

```bash
SEARCH_PROVIDER=brave BRAVE_SEARCH_API_KEY=your_key npm run dev
```

Only public web results are discovered. The system does not bypass private pages, logins, CAPTCHA, or hidden comments.

## 8. Supabase/PostgreSQL Setup

1. Create a Supabase project or PostgreSQL database.
2. Open Supabase `SQL Editor`.
3. Apply migrations in order:
   - `src/server/db/migrations/0001_init.sql`
   - `src/server/db/migrations/0002_auth_user_scope.sql`
   - `src/server/db/migrations/0003_workspaces_roles.sql`
   - `src/server/db/migrations/0004_model_metadata.sql`
4. Copy the pooled database connection string.
5. Set `DATABASE_URL`.
6. Set `PGSSLMODE=require` if required by the hosting environment.
7. Use `NEXT_PUBLIC_DATA_MODE=api` and `DATA_ACCESS_MODE=postgres`.

## 9. Supabase Auth Setup

1. In Supabase, open `Authentication`.
2. Enable the Email provider.
3. Add local app URL to allowed redirect/site URLs if required.
4. Copy project URL into `NEXT_PUBLIC_SUPABASE_URL`.
5. Copy anon key into `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
6. Set `AUTH_MODE=supabase`.
7. Start the app and use `/signup` and `/login`.

## 10. Testing Guide

Run these checks from the project root:

```bash
npm run typecheck
npm run lint
npm run build
```

Python syntax check for the ML service:

```bash
python3 -m py_compile ml-service/main.py
```

FastAPI health:

```bash
curl http://127.0.0.1:8000/health
```

FastAPI sentiment test:

```bash
curl -X POST http://127.0.0.1:8000/analyze/sentiment \
  -H 'content-type: application/json' \
  -d '{"records":[{"id":"r1","text":"The product is excellent."},{"id":"r2","text":"The app is slow and broken."}]}'
```

Evaluation API test:

```bash
curl -X POST http://127.0.0.1:3000/api/evaluation/run \
  -H 'content-type: application/json' \
  -d '{"dataset":{"id":"bench-1","name":"Benchmark","createdAt":"2026-06-04T00:00:00.000Z","sourceType":"paste","records":[{"id":"r1","text":"The product is excellent","expectedSentiment":"positive"},{"id":"r2","text":"The app is broken","expectedSentiment":"negative"}]}}'
```

## 11. Deployment Guide

### Next.js Deployment

1. Push the repository to a hosting provider such as Vercel or another Node-capable platform.
2. Configure environment variables in the hosting dashboard.
3. Apply PostgreSQL/Supabase migrations before enabling API mode.
4. Run production build:

```bash
npm run build
```

5. Start with the platform-specific Next.js command.

### FastAPI Deployment

Deploy `ml-service/` separately to a Python-capable service such as Render, Railway, Azure App Service, Fly.io, or a VM.

Start command:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

After deployment, configure Next.js:

```bash
ANALYSIS_PROVIDER=fastapi
FASTAPI_ML_URL=https://your-ml-service.example.com
```

### Production Recommendations

- Use HTTPS for both frontend and ML service.
- Restrict CORS origins in `ml-service/main.py` to production domains.
- Store secrets only in hosting environment variables.
- Enable Supabase Auth for production API mode.
- Apply database migrations before first API-mode run.
- Keep `NEXT_PUBLIC_DATA_MODE=local` for demos that do not require backend persistence.

## 12. Troubleshooting

| Problem | Likely Cause | Resolution |
| --- | --- | --- |
| API mode returns configuration error | Missing `DATABASE_URL` | Set database connection string |
| Supabase login fails | Missing Supabase env or provider disabled | Configure Supabase Auth |
| FastAPI fallback used | ML service unavailable or timeout | Start FastAPI and set `FASTAPI_ML_URL` |
| CSV upload has no records | Wrong selected column or blank rows | Choose correct text column |
| Evaluation metrics are empty | No benchmark run completed | Add labelled data and run evaluation |
| Public search returns disabled | Missing `SEARCH_PROVIDER` or provider API key | Set `SEARCH_PROVIDER=brave` and `BRAVE_SEARCH_API_KEY` |

## 13. Screenshot Placeholders

- `[Screenshot Placeholder: Environment variables in hosting dashboard]`
- `[Screenshot Placeholder: Supabase SQL editor migrations]`
- `[Screenshot Placeholder: FastAPI health endpoint response]`
- `[Screenshot Placeholder: Successful production build output]`
