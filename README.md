# Universal Opinion Intelligence Platform

Next.js App Router frontend and API layer for the Universal Opinion Intelligence Platform.

## Run Next.js

```bash
npm install
npm run dev
```

## Connect the FastAPI ML Service

Start the ML service first:

```bash
cd ml-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Then run Next.js with the FastAPI provider:

```bash
ANALYSIS_PROVIDER=fastapi FASTAPI_ML_URL=http://127.0.0.1:8000 npm run dev
```

If the ML service is unavailable, the app falls back to the local rule-based engine and records fallback metadata.

## Enable Public Search Discovery

Public search is disabled by default. To discover public web sources in the research wizard, configure Brave Search:

```bash
SEARCH_PROVIDER=brave BRAVE_SEARCH_API_KEY=your_key npm run dev
```

Supported provider values:

```bash
SEARCH_PROVIDER=disabled
SEARCH_PROVIDER=brave
SEARCH_PROVIDER=serpapi
SEARCH_PROVIDER=tavily
SEARCH_PROVIDER=custom
```

Only `brave` is implemented currently. Other values are adapter placeholders and return clear not-configured limitations.

## Data Modes

```bash
NEXT_PUBLIC_DATA_MODE=local
NEXT_PUBLIC_DATA_MODE=api-shadow
NEXT_PUBLIC_DATA_MODE=api
```

PostgreSQL/Supabase API mode also requires the database and auth environment documented in `src/server/README.md`.
