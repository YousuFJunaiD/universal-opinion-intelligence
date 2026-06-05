# Database Schema Plan

This schema is the PostgreSQL target for replacing browser `localStorage` repositories. Phase 10 does not connect a database yet.

## Tables

- `users`: application users and ownership root.
- `projects`: project metadata, analysis type, source choice, goal, workflow status, and `owner_id`.
- `datasets`: uploaded/pasted dataset envelope linked to a project.
- `dataset_records`: normalized raw text records linked to a dataset.
- `prepared_datasets`: cleaned dataset snapshots and preparation summary.
- `analysis_jobs`: processing lifecycle for preparation and analysis jobs.
- `sentiment_results`: sentiment output linked to project, dataset, prepared dataset, and job.
- `deep_analysis_results`: emotion, stance, aspect, and risk outputs.
- `recommendations`: deterministic recommendations and action roadmap.
- `report_snapshots`: saved report-ready snapshot payload.
- `report_exports`: browser-print/PDF export history.

## JSONB Boundaries

Complex derived outputs remain JSONB for early production flexibility:

- preparation summaries
- sentiment summaries and per-record results
- deep-analysis distributions, aspects, risk signals, and records
- recommendations and roadmap
- report snapshot payloads

As usage stabilizes, high-query fields can be promoted to relational tables or generated columns.

## Ownership

Phase 16 scopes API-mode data by `projects.owner_id`. Datasets, prepared data, jobs, analysis results, recommendations, reports, and export history remain linked through `project_id`, and repository queries verify project ownership before returning or mutating child records.
