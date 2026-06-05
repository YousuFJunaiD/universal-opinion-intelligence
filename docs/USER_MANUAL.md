# Universal Opinion Intelligence Platform: User Manual

## 1. Intended Users

The platform is intended for:

- product teams analyzing reviews and complaints
- brand managers monitoring reputation
- researchers studying public opinion
- political/public-opinion analysts
- student teams demonstrating applied NLP workflows
- support teams identifying recurring feedback themes

## 2. Accessing the Platform

Open the Next.js application in a browser. In local mode, the platform can be used without a configured database. In API mode with Supabase Auth, users must sign up or log in.

### Login

1. Open `/login`.
2. Enter email and password.
3. Submit the form.
4. On success, the user is redirected to the dashboard.

### Signup

1. Open `/signup`.
2. Enter email and password.
3. Submit the form.
4. If Supabase Auth is configured, an account is created through Supabase.
5. If Supabase is not configured in local development, the page routes into local/demo flow.

`[Screenshot Placeholder: Login and signup screens]`

## 3. Dashboard

The dashboard provides access to:

- project list
- project creation/onboarding
- workspaces
- model evaluation
- developer data-mode panel
- authenticated user display

`[Screenshot Placeholder: Main dashboard]`

## 4. Workspace Switching

The sidebar includes workspace switching for personal and shared workspace contexts.

Workspace roles:

| Role | Permissions |
| --- | --- |
| owner | Manage workspace, members, projects, and destructive actions |
| admin | Manage workspace members and workspace projects |
| analyst | Create/edit analysis workflows |
| viewer | View results and reports |

`[Screenshot Placeholder: Workspace switcher]`

## 5. Creating a Project

1. Open dashboard onboarding.
2. Enter project name.
3. Select analysis type:
   - Person/Profile
   - Brand
   - Product
   - Political/Public Opinion
   - Reviews
   - Custom Text
4. Select data source:
   - Upload CSV
   - Paste Text
   - API later
5. Select goal:
   - Reputation
   - Growth
   - Complaint detection
   - Audience understanding
   - Crisis risk
   - Product improvement
6. Create the project.

New projects start with status `Draft`.

`[Screenshot Placeholder: Project creation form]`

## 6. Adding Dataset Records

Open a project detail page and use the `Data Intake` section.

### Paste Text

1. Select paste input.
2. Paste one comment/review/post per line.
3. Preview the detected records.
4. Save the dataset.

The platform rejects empty input and recommends at least five records for meaningful analysis.

### Upload CSV

1. Upload a CSV file.
2. The system detects available columns.
3. Select the column containing text/comment/review content.
4. Preview records.
5. Save the dataset.

After saving data, project status changes from `Draft` to `Data Added`.

`[Screenshot Placeholder: Data intake with CSV column selection]`

## 7. Preparing Analysis

Click `Prepare Analysis` after data is added.

Preparation performs:

- whitespace trimming
- empty-row removal
- repeated-space normalization
- exact duplicate removal
- quality metric calculation
- placeholder language assignment as `unknown`

Preparation summary includes:

- original records
- clean records
- removed duplicates
- removed empty records
- readiness score
- average text length
- shortest and longest text length

Project status changes from `Data Added` to `Ready for Analysis`.

`[Screenshot Placeholder: Preparation summary]`

## 8. Running Sentiment Analysis

Click `Run Analysis` when the project is ready.

The platform uses the configured provider:

- `rule-based`: deterministic local keyword baseline.
- `fastapi`: external FastAPI service using the VADER baseline.
- fallback: local rule-based engine if the external service fails.

Sentiment output includes:

- total analyzed
- positive count and percentage
- negative count and percentage
- neutral count and percentage
- confidence values
- per-record sentiment table

Project status changes from `Ready for Analysis` to `Analysed`.

`[Screenshot Placeholder: Sentiment dashboard]`

## 9. Running Deep Analysis

Click `Run Deep Analysis` after sentiment analysis exists.

Deep analysis includes:

- emotion distribution
- stance distribution
- detected aspects
- risk signals
- per-record deep analysis table

Current deep analysis is deterministic and lexical. It is designed to be replaced by future ML models.

`[Screenshot Placeholder: Deep analysis dashboard]`

## 10. Generating Recommendations

Click `Generate Recommendations` after deep analysis.

Recommendations are generated from real saved metrics:

- high negative percentage
- anger/sadness signals
- repeated aspects
- opposing stance
- trust/joy signals
- risk keywords

The system shows:

- executive action summary
- priority recommendations
- evidence behind each recommendation
- 7-day roadmap
- 30-day roadmap
- long-term improvement plan

Recommendations are rule-based and evidence-driven. They are not AI-generated strategic hallucinations.

`[Screenshot Placeholder: Recommendations and roadmap]`

## 11. Generating Reports

Click `Generate Report Snapshot` after analysis and recommendations are available.

Report snapshot includes:

- project details
- dataset details
- preparation summary
- sentiment summary
- risk level
- dominant sentiment
- average confidence
- top positive records
- top negative records
- deep analysis when available
- recommendations when available
- deterministic executive summary

Project status may change to `Report Ready`.

`[Screenshot Placeholder: Report preview]`

## 12. Exporting PDF

Use `Export PDF` inside or near report preview.

The platform uses browser print/export:

1. Click `Export PDF`.
2. Browser print dialog opens.
3. Choose `Save as PDF`.
4. Save the file.

The printable report excludes dashboard buttons and uses A4-friendly spacing.

`[Screenshot Placeholder: Browser PDF print dialog]`

## 13. Editing and Deleting Projects

Project settings allow users to:

- edit project name
- edit goal
- edit analysis type
- delete project after confirmation

Dataset actions allow:

- delete dataset
- replace dataset

Destructive actions require confirmation. API mode verifies ownership before mutation.

`[Screenshot Placeholder: Project settings and danger zone]`

## 14. Benchmark Evaluation Workflow

Open `/dashboard/evaluation`.

### Create Benchmark Data

Use CSV-style labelled records:

```csv
text,expectedSentiment
"The product is excellent and helpful",positive
"The app is slow and broken",negative
"The delivery arrived yesterday",neutral
```

Required fields:

- `text`
- `expectedSentiment`

Accepted labels:

- `positive`
- `negative`
- `neutral`

### Run Evaluation

1. Paste labelled records or upload a CSV.
2. Click `Preview benchmark`.
3. Click `Run evaluation`.
4. Review metrics.
5. Export JSON or CSV if needed.

Metrics shown:

- accuracy
- macro precision
- macro recall
- macro F1
- per-class precision/recall/F1
- confusion matrix
- wrong predictions

Metrics are computed only from user-provided labelled benchmark data.

`[Screenshot Placeholder: Benchmark evaluation results]`

## 15. Common User Errors

| Issue | Resolution |
| --- | --- |
| Empty dataset | Add at least one valid text record |
| Very small dataset | Use at least five records for more meaningful analysis |
| CSV not previewing | Confirm the file has a text/comment/review column |
| FastAPI unavailable | Start `ml-service` or allow fallback to rule-based mode |
| PDF includes browser headers | Disable browser headers/footers in print dialog |
| Supabase login fails | Confirm Supabase URL, anon key, and email provider settings |

## 16. Screenshot Checklist

- `[Screenshot Placeholder: Project list]`
- `[Screenshot Placeholder: New project wizard]`
- `[Screenshot Placeholder: Data preview table]`
- `[Screenshot Placeholder: Sentiment charts]`
- `[Screenshot Placeholder: Report PDF output]`
- `[Screenshot Placeholder: Evaluation metrics table]`
