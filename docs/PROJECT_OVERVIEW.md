# Universal Opinion Intelligence Platform: Project Overview

## 1. Project Overview

The Universal Opinion Intelligence Platform is a chat-first analytical system for converting unstructured public or private text feedback into structured opinion intelligence. It supports datasets such as social media comments, product reviews, brand feedback, survey responses, and custom text collections.

The platform guides users through project creation, data intake, preparation, sentiment analysis, multi-dimensional analysis, recommendations, reporting, PDF export, workspace collaboration, API-backed persistence, authentication, and benchmark evaluation. The current implementation includes deterministic rule-based engines, a lightweight FastAPI VADER baseline service, PostgreSQL/Supabase readiness, and a model-adapter architecture for future transformer-based NLP models.

No artificial or fabricated metrics are included. Evaluation scores are computed only when a user provides labelled benchmark data.

## 2. Problem Statement

Organizations, public figures, product teams, and researchers receive large volumes of text feedback across many channels. Manual review is slow, inconsistent, and difficult to scale. Existing tools are often either too generic, too expensive, limited to one channel, or opaque about how conclusions are generated.

This project addresses the need for a transparent, extensible, and research-ready platform that can ingest text feedback, prepare it for analysis, generate interpretable baseline results, and produce evidence-backed reports without depending on fabricated model output.

## 3. Objectives

- Provide a clean chat-first workflow for creating opinion analysis projects.
- Support local data intake through pasted text and CSV uploads.
- Prepare datasets through cleaning, deduplication, and quality checks.
- Run baseline sentiment analysis using deterministic local logic or a FastAPI NLP service.
- Extend analysis to emotion, stance, aspects, and risk signals using deterministic engines.
- Generate evidence-based recommendations and action roadmaps.
- Produce report snapshots and browser-print PDF exports.
- Support localStorage, API-shadow, and API/PostgreSQL data modes.
- Add authentication and user-scoped API access through development auth or Supabase Auth.
- Support workspaces, roles, and shared project visibility.
- Provide benchmark evaluation metrics for research-paper reporting.
- Keep the architecture replaceable for future ML models such as BERT, RoBERTa, DistilBERT, or Azure Text Analytics.

## 4. Scope

### Included

- Landing page, login/signup placeholder and Supabase email/password auth support.
- Dashboard, workspace switcher, project creation, project settings, and delete/edit flows.
- Paste text and CSV data intake.
- Dataset preparation and quality summary.
- Rule-based sentiment baseline.
- FastAPI ML adapter and VADER-based sentiment service.
- Deep analysis for emotion, stance, aspects, and risk signals.
- Evidence-driven recommendations and action roadmap.
- Sentiment dashboard, report snapshot, printable PDF layout, and export history.
- PostgreSQL-ready migrations and repositories.
- Benchmark evaluation workflow for accuracy, precision, recall, F1, confusion matrix, and per-class metrics.

### Excluded From Current Build

- Real social media API ingestion.
- Production invitation emails.
- Billing and subscription management.
- Transformer model training or hosted inference.
- AI-generated strategy recommendations.
- Automated PDF generation through a server-side PDF engine.

## 5. Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js App Router, React, TypeScript |
| Styling | Tailwind CSS, shadcn-style local UI primitives |
| Client Persistence | localStorage repositories |
| API Layer | Next.js Route Handlers |
| Database-Ready Layer | PostgreSQL/Supabase schema and repositories |
| Authentication | Development auth fallback and Supabase Auth utilities |
| ML Service | FastAPI |
| ML Baseline | VADER sentiment via `vaderSentiment` |
| Reports | Browser print CSS and printable React report layout |
| Evaluation | User-provided labelled benchmark datasets |

## 6. Major Modules

### Project Management

Users create projects by selecting what they want to analyze, analysis type, data source, and project goal. Projects can be edited or deleted. API mode scopes project access by user ownership and workspace permissions.

### Data Intake

Projects accept pasted text or CSV uploads. CSV columns are detected client-side, and users choose the text column. Datasets are stored locally in local mode and through repository adapters in API mode.

### Analysis Preparation

The preparation layer trims whitespace, removes empty records, normalizes repeated spaces, removes exact duplicates, computes dataset quality metrics, and marks language as `unknown` for future detection.

### Sentiment Analysis

The application supports:

- `rule-based`: deterministic keyword baseline inside the Next.js app.
- `fastapi`: external FastAPI service through `FASTAPI_ML_URL`.
- `azure`: adapter placeholder that currently falls back safely.

The FastAPI implementation uses VADER as a lightweight real NLP baseline. If the FastAPI service fails, the Next.js app falls back to the local rule-based engine and stores fallback metadata.

### Deep Analysis

Deep analysis adds emotion, stance, aspect, and risk-signal detection. Current logic is deterministic and evidence-driven, designed to be replaced by ML services later.

### Recommendations

Recommendations are generated from real sentiment and deep-analysis metrics. They are rule-based and evidence-driven, not AI-hallucinated.

### Reporting

Report snapshots are generated from saved project, dataset, preparation, sentiment, deep-analysis, and recommendation data. Printable report layouts support browser PDF export.

### Benchmark Evaluation

The evaluation page accepts labelled records with `text` and `expectedSentiment`. The system runs the current sentiment provider and calculates real metrics from predictions compared against expected labels.

## 7. Screenshot Placeholders

Add final screenshots before submission:

- `[Screenshot Placeholder: Landing page]`
- `[Screenshot Placeholder: Login/signup screen]`
- `[Screenshot Placeholder: Dashboard and workspace switcher]`
- `[Screenshot Placeholder: Project creation flow]`
- `[Screenshot Placeholder: Data intake section]`
- `[Screenshot Placeholder: Sentiment dashboard]`
- `[Screenshot Placeholder: Deep analysis dashboard]`
- `[Screenshot Placeholder: Recommendations and roadmap]`
- `[Screenshot Placeholder: Report preview and PDF print view]`
- `[Screenshot Placeholder: Benchmark evaluation page]`

## 8. Academic Relevance

The platform is suitable for a final year project because it demonstrates full-stack architecture, user-centered design, data processing, baseline NLP, API integration, database readiness, authentication, role-based access, reporting, and empirical model evaluation. Its evaluation module supports research-paper reporting without inventing results.
