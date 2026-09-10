# Resume Alignment Report

Audit date: 9 September 2026. Target directions supplied by the student: AI automation, cloud/automation engineering, AI workflow engineering, cloud solutions and product/technical roles. This assessment concerns project evidence, not a prediction of hiring outcomes.

## Does it fit the career direction?

Yes. The project is relevant because it connects software interfaces, a model-serving service, structured input processing, conditional workflows, persistence design, reporting and benchmark automation. Those are more relevant to the stated direction than presenting only a sentiment-classification accuracy score.

The existing AI-automation internship and Azure fundamentals background provide context, but the project does not itself prove an Azure deployment, distributed-system operation, business adoption or measured automation savings. Founder/CEO work at Omnimate should remain a separate experience entry; do not imply this project has Omnimate customers or production usage without evidence.

## Name and positioning

Use **Opinion Intelligence & Automated Reporting Platform** as a concise resume project title. The college title can remain **Universal Opinion Intelligence & Trust Analysis Platform**. In a resume, “trust” needs a clear explanation and may invite authenticity questions; the automation/reporting wording is easier to defend.

One-line description: **AI-powered software for repeatable feedback analysis, review-quality flagging, evidence review, and saved report generation, with a separately benchmarked FastAPI sentiment service.**

Describe it as a team college project if applicable. Use only bullets matching your own contribution. Confirm contribution ownership and disclose AI-assisted development if asked; you should be able to explain and modify the code you present.

## Evidence by skill

| Skill | Evidence in this repository | Safe resume wording |
|---|---|---|
| Full-stack workflow design | Next.js/React/TypeScript UI; route handlers and typed services | Built a feedback-to-report workflow |
| NLP component integration | FastAPI, VADER, pretrained RoBERTa, hybrid routing | Integrated/evaluated existing sentiment components |
| Automation engineering | Parsing, preparation, rule decisions, snapshot/export, benchmark scripts | Automated dataset summarization and report assembly |
| Reliability thinking | Fallback metadata, input caps, storage recovery, browser regressions | Added failure handling and validation for a local workflow |
| Data modeling | Local and PostgreSQL repositories, migration files | Designed persistence abstractions and database schema |
| Container preparation | Two Dockerfiles and build-context exclusion files | Prepared container definitions; do not say container deployment was verified |
| Evaluation | Fixed-seed manifest, result JSON, confusion matrix, batch/hybrid studies | Evaluated model-serving trade-offs on 5,000 labeled records |
| Technical communication | Audit, limitations, scripts, diagrams, evidence map | Documented architecture, reproduction steps and claim boundaries |
| Cloud operations | Architectural separation and deployment notes | Cloud-oriented design only; live deployment evidence remains missing |

## Best three resume bullets

- Built a Next.js/TypeScript opinion-analysis workflow with CSV/text intake, domain keyword groups, review-quality explanations, browser-persisted snapshots, and Markdown/print exports for human review.
- Integrated and evaluated a FastAPI sentiment service using VADER, pretrained RoBERTa and hybrid routing; RoBERTa achieved **0.8098 accuracy and 0.7587 macro F1** on a fixed-seed stratified **5,000-record** airline dataset.
- Added input/storage recovery and automated validation; the audited showcase passed **17 intake/flagging checks and 19 browser workflow checks**, alongside TypeScript, lint and build validation.

Use these counts only with the retained audit evidence. Do not describe the 19 cases as exhaustive test coverage. If you did not own one of these areas, replace “built” or “added” with a precise collaboration statement.

## What cloud ability is still missing?

A reviewer cannot infer cloud execution from a Dockerfile. To make a cloud-focused claim, capture a successful container build/run, a sanitized deployment configuration, a working HTTPS endpoint, private ML/database access, engine-aware readiness, request logs, a controlled failure test, and a reproducible teardown/rollback procedure. Current URL-fetch, direct-service input/auth, DB TLS and cross-tenant gaps must be handled before public exposure.

No GitHub Actions CI or Docker Compose file was found in the audited tree. Do not list them as implemented. A README link and diagram are documentation, not deployment results. A license decision and clean public artifact are also unresolved; do not call the repository a released open-source package solely because a repository URL exists.

## Additions that preserve the core project

| Addition | Value | Completion evidence |
|---|---|---|
| Tested Docker Compose for app and ML service | Demonstrates multi-service local orchestration | Clean-machine start, health behavior, documented local-only profile |
| GitHub Actions checks | Makes validation repeatable | Passing workflow run with declared test dependencies and sanitized output |
| API contract documentation | Shows integration design | Example synthetic requests/responses, error/fallback cases and engine metadata |
| Bounded model-serving endpoint | Shows safe AI service integration | Input/auth/concurrency tests against the service itself |
| Model revision/environment manifest | Improves reproducibility | Captured runtime versions, hardware and model commit |
| Monitoring plan, followed by one implementation | Shows operational thinking | Latency/error/engine-fallback metrics without private text logging |
| Future Azure deployment | Connects Azure fundamentals to an artifact | A reviewed, cost-bounded deployment with actual evidence; architecture diagram alone remains proposed |
| Release notes and security review | Shows delivery discipline | Explicit scope, known issues, clean artifact and approved license |

These are post-showcase enhancements. Do not add multiple cloud services immediately before the college demo.

## Interview explanation

“I built a repeatable workflow that accepts feedback records, produces sentiment and text-quality signals, retains the evidence, and exports a report. The live college path is intentionally browser-local and independent of external services. Separately, I evaluated VADER, RoBERTa and hybrid serving through FastAPI on a reproducible 5,000-record sample. The engineering decisions concern input contracts, failure handling, configuration, evidence identity, persistence and reporting. I can explain where the evidence stops: no authenticity verification, no user-outcome study, and incomplete cloud and multi-tenant validation.”

For a cloud interviewer, discuss the API boundary, environment separation, private inference network, model warm-up, body limits, trusted forwarded headers, database TLS and readiness probes. For an automation interviewer, show the transition from input to saved output, replay an input, and demonstrate recovery when storage is denied. For a product interviewer, explain why a dedicated workflow may help users organize evidence and why that benefit still needs user testing.

## Phrases to avoid

Avoid “deployed scalable SaaS,” “fraud/fake-review detector,” “95% confidence of correctness,” “multilingual sentiment platform,” “replaced GPT,” “saved organizations X hours,” and “improved purchasing/medical/government decisions.” No such outcome or capability is established by this audit.
