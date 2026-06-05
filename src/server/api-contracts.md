# API Contracts

Phase 11 introduced API contracts and safe local-mode route handlers. Phase 14 adds PostgreSQL persistence for API mode. The UI can still use browser localStorage repositories directly.

Phase 12 adds `NEXT_PUBLIC_DATA_MODE`:

- `local`: localStorage only.
- `api-shadow`: localStorage remains source of truth, API routes are called in parallel.
- `api`: API routes persist to PostgreSQL when `DATABASE_URL` is configured.

`GET /api/health` returns `{ status, mode, timestamp }`.

Local-mode mutation routes return:

```json
{
  "mode": "local",
  "persisted": false,
  "message": "Contract accepted, but server persistence is disabled.",
  "received": {}
}
```

API-mode mutation routes return the same success envelope with `mode: "api"` and `persisted: true`, plus saved resource identifiers in `received` where applicable.

## Projects

`POST /api/projects`

Request: `ProjectCreateRequest`

- `name`
- `analysisType`
- `dataSource`
- `goal`

Response: `ProjectResponse`

## Datasets

`POST /api/datasets`

Request: `DatasetCreateRequest`

- `projectId`
- `sourceType`
- `records`
- optional `fileName`
- optional `selectedColumn`
- optional `columns`

Response: `DatasetResponse`

## Analysis

`POST /api/analysis/prepare`

Request: `AnalysisPrepareRequest`

- `projectId`
- `datasetId`

`POST /api/analysis/run-sentiment`

Request: `AnalysisRunRequest`

- `projectId`
- `datasetId`
- optional `preparedDatasetId`

`POST /api/analysis/run-deep`

Request: `AnalysisRunRequest`

- `projectId`
- `datasetId`
- optional `preparedDatasetId`
- optional `analysisResultId`

## Recommendations

`POST /api/recommendations/generate`

Request: `AnalysisRunRequest`

- `projectId`
- `datasetId`
- optional `analysisResultId`

## Reports

`POST /api/reports/generate`

Request: `ReportCreateRequest`

- `projectId`
- `datasetId`
- `analysisResultId`
- `preparedDatasetId`
- optional `multiDimensionalAnalysisResultId`
- optional `recommendationResultId`

## Error Shape

`ApiErrorResponse`

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```

## Phase 14 Implementation Notes

- Keep local UI flow working while incrementally moving actions to API calls.
- Server persistence is active only when `NEXT_PUBLIC_DATA_MODE=api`, `DATA_ACCESS_MODE=api`, or `DATA_ACCESS_MODE=postgres`.
- `api-shadow` must remain safe even if API calls fail.
- PostgreSQL repositories are replaceable behind the API route layer.
