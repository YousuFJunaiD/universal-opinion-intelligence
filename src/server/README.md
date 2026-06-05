# Server Backend Readiness

The application defaults to browser localStorage mode. Phase 14 adds PostgreSQL/Supabase persistence behind API routes without removing the local flow.

## Database Setup Plan

1. Provision PostgreSQL or create a Supabase project.
2. Apply migrations from `src/server/db/migrations` in numeric order.
3. Set `DATABASE_URL` for API mode.
4. Set `NEXT_PUBLIC_DATA_MODE=api` or `DATA_ACCESS_MODE=postgres` when you want API routes to persist to PostgreSQL.
5. Set `DEV_USER_ID` and `DEV_USER_EMAIL` for temporary development authentication.
6. Apply `0003_workspaces_roles.sql` when enabling shared workspaces.
7. Keep `NEXT_PUBLIC_DATA_MODE=local` for browser localStorage-only development.

## Supabase SQL Editor Setup

1. Open your Supabase project.
2. Go to `SQL Editor`.
3. Create a new query.
4. Paste the full contents of `src/server/db/migrations/0001_init.sql`.
5. Run the query once.
6. Create another query with `src/server/db/migrations/0002_auth_user_scope.sql`.
7. Run the second migration once.
8. Create another query with `src/server/db/migrations/0003_workspaces_roles.sql`.
9. Run the third migration once.
10. Open `Project Settings` > `Database`.
11. Copy the pooled PostgreSQL connection string into `DATABASE_URL`.
12. Use `PGSSLMODE=require` if your environment does not infer SSL from the Supabase URL.

## Migration Plan

- `0001_init.sql` creates users, projects, datasets, records, prepared datasets, jobs, analysis outputs, recommendations, report snapshots, and export history.
- JSONB is used for complex analysis payloads while the product stabilizes.
- Later migrations can promote frequently queried JSONB fields into relational tables or generated columns.

## Environment Variables

- `NEXT_PUBLIC_DATA_MODE=local`: current browser localStorage mode.
- `NEXT_PUBLIC_DATA_MODE=api-shadow`: browser localStorage remains source of truth and actions also call API routes safely.
- `NEXT_PUBLIC_DATA_MODE=api`: API routes use PostgreSQL persistence when `DATABASE_URL` is configured.
- `DATA_ACCESS_MODE=local`: force server routes into local contract mode.
- `DATA_ACCESS_MODE=postgres`: force server routes to use PostgreSQL.
- `AUTH_MODE=dev`: use the temporary development user.
- `AUTH_MODE=supabase`: use real Supabase Auth sessions.
- `ANALYSIS_PROVIDER=rule-based`: use local deterministic baseline analysis.
- `ANALYSIS_PROVIDER=fastapi`: call an external FastAPI ML service and fallback to rule-based if it fails.
- `ANALYSIS_PROVIDER=azure`: reserved for Azure Text Analytics adapter; currently falls back to rule-based.
- `FASTAPI_ML_URL`: base URL for the FastAPI ML service, for example `http://127.0.0.1:8000`.
- `SEARCH_PROVIDER=disabled`: default public research discovery mode.
- `SEARCH_PROVIDER=brave`: use Brave Search API for public source discovery.
- `BRAVE_SEARCH_API_KEY`: Brave Search API key.
- `SERPAPI_API_KEY`: reserved for future SerpAPI provider.
- `TAVILY_API_KEY`: reserved for future Tavily provider.
- `DATABASE_URL`: PostgreSQL or Supabase connection string.
- `PGSSLMODE=require`: optional SSL hint for hosted PostgreSQL.
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon/public key.
- `SUPABASE_SERVICE_ROLE_KEY`: reserved for future server-only admin operations. Not required by Phase 17.
- `DEV_USER_ID`: temporary development user UUID for API mode.
- `DEV_USER_EMAIL`: temporary development user email shown in the developer panel.

Default mode is `local`.

## Temporary Dev Auth

Phase 16 uses a development-only auth helper until a real provider is connected. In API/PostgreSQL mode, routes call `getCurrentUser()` and scope projects by `owner_id`.

- In development, missing `DEV_USER_ID` and `DEV_USER_EMAIL` fall back to `00000000-0000-4000-8000-000000000001` and `dev@uoip.local`.
- In production API mode, configure both variables. The API will not invent a user.
- The helper upserts the dev user into `users` before Postgres operations.
- Login and signup pages use Supabase email/password only when Supabase client env variables are configured.

## Supabase Auth Setup

Phase 17 adds Supabase email/password authentication.

1. Open your Supabase project.
2. Go to `Authentication` > `Providers`.
3. Enable `Email`.
4. For local development, add `http://localhost:3000` to allowed site/redirect URLs if your Supabase project requires explicit redirects.
5. Copy `Project URL` into `NEXT_PUBLIC_SUPABASE_URL`.
6. Copy the anon public key into `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
7. Set `AUTH_MODE=supabase`.
8. Set `NEXT_PUBLIC_DATA_MODE=api` and `DATA_ACCESS_MODE=postgres`.
9. Make sure `0001_init.sql` and `0002_auth_user_scope.sql` have been applied.

In Supabase auth mode, `/dashboard` requires a valid session and redirects unauthenticated users to `/login`. The authenticated Supabase user ID is upserted into `users.id` and used as `projects.owner_id`.

## Auth Testing

Dev auth:

```bash
AUTH_MODE=dev NEXT_PUBLIC_DATA_MODE=api DATA_ACCESS_MODE=postgres npm run dev
```

Supabase auth:

```bash
AUTH_MODE=supabase NEXT_PUBLIC_DATA_MODE=api DATA_ACCESS_MODE=postgres npm run dev
```

Use `/signup` to create an email/password account, then `/login` to sign in. Confirm the dashboard sidebar shows the signed-in email.

## Future API Endpoints

- `POST /api/projects`
- `POST /api/datasets`
- `POST /api/analysis/prepare`
- `POST /api/analysis/run-sentiment`
- `POST /api/analysis/run-deep`
- `POST /api/recommendations/generate`
- `POST /api/reports/generate`
- `POST /api/reports/export`
- `GET/POST /api/workspaces`
- `GET/POST /api/workspaces/[workspaceId]/members`
- `PATCH/DELETE /api/workspaces/[workspaceId]/members/[memberId]`

In local mode, routes validate contracts but do not persist server-side data. In API mode, routes persist to PostgreSQL using repository adapters.

## Workspace Roles

Phase 19 adds shared workspace structure:

- `owner`: manages workspace, members, projects, and deletes.
- `admin`: manages workspace members and workspace projects.
- `analyst`: creates and runs analysis on workspace projects.
- `viewer`: reads shared results and reports only.

Projects may be personal (`workspace_id` is null) or workspace-owned (`workspace_id` set). API repositories verify membership before shared project reads, and verify role before mutations.

## ML Provider Adapter

Phase 20 adds an adapter layer for analysis providers:

- `rule-based`: deterministic local baseline and default provider.
- `fastapi`: external ML service adapter with timeout/error handling.
- `azure`: placeholder for Azure Text Analytics.

FastAPI mode:

```bash
ANALYSIS_PROVIDER=fastapi FASTAPI_ML_URL=http://127.0.0.1:8000 npm run dev
```

If the FastAPI service is unavailable, times out, or returns an error, the API falls back to the rule-based baseline and stores fallback metadata in the analysis result.

The included local ML service lives in `ml-service/` and can be started with:

```bash
cd ml-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Expected FastAPI sentiment endpoint:

`POST /analyze/sentiment`

Request:

```json
{
  "projectId": "uuid",
  "datasetId": "uuid",
  "preparedDatasetId": "uuid",
  "analysisJobId": "uuid",
  "records": [{ "id": "record-id", "text": "comment text" }]
}
```

Response:

```json
{
  "modelName": "distilbert-sentiment",
  "modelVersion": "1.0.0",
  "confidence": 0.91,
  "summary": {
    "totalAnalysed": 1,
    "positiveCount": 1,
    "negativeCount": 0,
    "neutralCount": 0,
    "positivePercentage": 100,
    "negativePercentage": 0,
    "neutralPercentage": 0
  },
  "records": [
    {
      "id": "result-id",
      "recordId": "record-id",
      "text": "comment text",
      "sentiment": "positive",
      "confidence": 0.91,
      "positiveKeywordMatches": [],
      "negativeKeywordMatches": []
    }
  ]
}
```

Expected FastAPI deep-analysis endpoint:

`POST /analyze/deep`

Response should include `modelName`, `modelVersion`, `confidence`, `emotionDistribution`, `stanceDistribution`, `aspects`, `riskSignals`, and per-record deep analysis results.

Future model options include BERT, RoBERTa, DistilBERT, and Azure Text Analytics. Evaluation scores should only be filled after running a labelled benchmark dataset.
