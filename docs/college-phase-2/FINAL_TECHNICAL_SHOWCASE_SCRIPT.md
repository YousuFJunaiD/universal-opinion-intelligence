# Final Technical Showcase Script

Prepared: 9 September 2026. Target: approximately 8–10 minutes plus questions. Keep the speech tied to the interface and actual evidence. Shorten optional benchmark/cloud discussion if the panel gives less time.

## Before speaking

Start the local app using the safe command in `FINAL_AUDIT_AND_VALIDATION_REPORT.md`. Open `http://127.0.0.1:3000/showcase` in the same browser you rehearsed. Keep the three local CSV files, synthetic Markdown/PDF proof and screenshots accessible. Use no private customer, student or patient text.

Have two views available: the live `/showcase` page and the fixed-seed benchmark table from `FULL_PROJECT_EXPLANATION.md`. They demonstrate different execution paths. Do not present the benchmark table as live results.

## 1. Project introduction

“Our project is the Universal Opinion Intelligence & Trust Analysis Platform. It is an AI-powered opinion-intelligence and automated reporting workflow. It accepts supplied feedback records, summarizes sentiment, flags potentially generic or repeated text, preserves evidence, and produces saved reports for human review.

“The word trust refers to reviewing text quality and supporting evidence. We do not confirm that a review is fake, that a product is safe, or that a person is trustworthy.”

## 2. Problem statement

“The problem is that feedback arrives as many individual comments. Reading them manually does not automatically give us consistent counts, a traceable review queue, or a repeatable report. We connect those steps in one software workflow. We have not yet measured improvements in human decisions or time saved in an organization.”

## 3. Multi-domain scope

[Point to the six cards.]

“This is broader than online shopping. We can analyze product reviews, anonymous college feedback, healthcare service-experience comments, brand complaints, public-service feedback, and comments about a figure or topic. The selector also includes surveys, customer-support feedback, local businesses and social-media comments.

“These choices change the report context and keyword groups. They do not prove that one model is equally accurate in every domain. Healthcare examples are limited to service experience, and public comments are not a representative poll.”

## 4. Architecture and technologies

“The web application uses Next.js App Router, React, TypeScript and Tailwind CSS. The broader application has Next.js route handlers, application services, repository abstractions and a Supabase/PostgreSQL persistence design. A separate FastAPI service exposes sentiment inference using VADER, pretrained RoBERTa and hybrid routing.

“For today's complete demonstration, this page uses local browser rules and localStorage. It does not need Supabase, FastAPI or search credentials. That choice makes the demonstration independent of those services, while limiting the language analysis.”

[Show the three-path diagram only if asked. Explain that the ordinary dashboard local mode, API mode and showcase mode differ.]

## 5. Input-to-report pipeline

[Click Product Reviews Demo and show its loaded text.]

“This file contains 15 synthetic reviews. We use synthetic data to demonstrate behavior without exposing private records. It deliberately contains detailed feedback, short praise, short complaints, promotional-looking wording and a duplicate.

“The input parser recognizes a text column, preserves any source ID, assigns a distinct row ID, skips blanks and retains duplicate records. It handles quoted commas and multiline CSV fields. The browser showcase is capped at 250 records, with length limits, to bound its work. A public URL entered here is context only; it does not collect comments.”

[Click Run Analysis.]

“The run creates sentiment labels, computes quality rules and keyword mentions, selects a rule-based suggestion, builds the report snapshot, and tries to save it in this browser. The status tells us whether saving succeeded.”

## 6. Explain the live sentiment result

[Point to record count, positive/negative/neutral tiles and engine metadata.]

“The engine shown is browser-rule-based-showcase version 1.1.0. It compares positive and negative word cues and includes a limited local negation rule. Neutral can mean a tie or missing vocabulary, not necessarily indifference. The rule score displayed with examples is uncalibrated and must not be interpreted as prediction accuracy.

“The headline counts are computed from these records. They do not measure all customers or prove what the population thinks.”

Expected synthetic outputs for the audited version:

| Demo | Records | Positive | Negative | Neutral | Quality flags |
|---|---:|---:|---:|---:|---:|
| Product Reviews | 15 | 6 | 5 | 4 | 7 |
| Brand Feedback | 15 | 4 | 6 | 5 | 7 |
| Public Figure Comments | 15 | 3 | 4 | 8 | 7 |

These are generated demo outputs, not correctness measurements. Do not call them accuracy or tune inputs to conceal errors.

## 7. Explain quality flags

[Show a generic one-line example, then the duplicate and its earlier row ID.]

“This record is flagged because it is short or uses generic wording with little supporting detail. This duplicate is flagged because normalized text appeared earlier. The near-duplicate check uses token overlap. Other rules look for promotional phrases, repeated characters or punctuation, and repeated phrases.

“Each row includes reasons and evidence. The flag means ‘manual review needed,’ not ‘confirmed fake.’ A genuine short review may trigger it. A detailed misleading review may not trigger it. We have no purchase verification, reviewer history or account metadata.

“Notice that duplicates are retained in the sentiment totals. We are showing a concern rather than silently rewriting the dataset.”

## 8. Keyword groups, suggestions and reports

“The domain groups count records mentioning terms such as battery or support. They are keyword counts, not a trained aspect-level sentiment model.

“The recommendation is selected by fixed transparent rules. A high flagged share can produce a warning before complaint or positive-signal thresholds are checked. It supports human review and has not been validated in a user study.”

[Scroll to the report, identify its title/engine/limitations. Click Download Markdown.]

“The report has counts, evidence, quality reasons, source context, engine version and limitations. Markdown retains every analyzed row. The printed view includes selected examples, and Print / Save PDF uses the browser's printing function.”

[Refresh.]

“The saved snapshot and its matching input are restored from localStorage in this browser. This is not shared database persistence. If storage is unavailable, the page says so and leaves the current report available for export.”

## 9. Demonstrate scope beyond products

[Load Brand Feedback Demo, run, then Public Figure Comments Demo and run.]

“The same pipeline handles service complaints and public-topic comments. These are still synthetic snapshots. The three bundled datasets share a pattern of generic records, so all three trigger a quality-warning headline. That is a property of the sample design, not a hard-coded response or a real-world prevalence estimate.”

[If time permits, select College Feedback and paste the six statements from `USE_CASE_AND_LOGIC_AUDIT.md`. Run again.]

“Now the text is about college experience. We can see the lab keyword group and a report title matching the chosen context. Selecting a card alone would not change the original product text; the operator must supply relevant records.”

## 10. Present the separate benchmark

[Switch to the benchmark table, not the live dashboard.]

“We evaluated the separate FastAPI sentiment path on a fixed-seed stratified sample of 5,000 labeled airline records. The seed is 20260622, and the manifest preserves source IDs, row indexes and hashes. There are 807 positive, 3,135 negative and 1,058 neutral labels.

“RoBERTa achieved 0.8098 accuracy and 0.7587 macro F1. VADER achieved 0.4860 and 0.4528; the Python fallback achieved 0.2988 and 0.3018. Macro F1 is primary because the sample is imbalanced. Neutral was the hardest RoBERTa class, with F1 0.6166.

“These are historical component results. The local showcase rules were not the classifier measured in that experiment.”

## 11. Efficiency and hybrid interpretation

“We also varied serving configuration. Batch 16 was fastest in the recorded sweep at 2.9267 milliseconds per record. Batch 1 was 9.8664 and batch 32 was 3.0871. Accuracy and macro F1 stayed constant. The script did not save a full prediction-by-prediction comparison, so we do not claim it independently proved identical labels. Timing needs repetitions before selecting a general default.

“Hybrid threshold 0.85 achieved 0.8048 accuracy and 0.7524 macro F1 while sending 92.24 percent of records to RoBERTa. It approached transformer quality but avoided only 7.76 percent of transformer inference. It was slower than transformer batch 32 in the recorded sweep. We therefore present an evaluated routing trade-off, not guaranteed cost savings.”

## 12. Contribution and comparison with general assistants

“We integrated input processing, model-serving options, quality rules, evidence, snapshots, reports and evaluation artifacts. The software system and workflow are the contribution. We did not invent RoBERTa or train a new model, and we cannot claim better performance than all previous papers.

“Compared with manually repeating a chat request, our project provides a consistent record-based interface, named rules, saved evidence and export. That is a workflow benefit. It does not establish superior reasoning or language accuracy to GPT or Claude, and no head-to-head study was performed.”

## 13. Limitations and future work

“The current benchmark has one English dataset and one seed, without confidence intervals, significance tests or a user study. The showcase can misread sarcasm, context and mixed-language text. The quality flagger has no authenticity labels or reviewer metadata.

“Historical runtime documentation records six of nine checks as passed. Supabase/API end-to-end operation, cross-tenant authorization and full-system report/PDF export remain open. The audit also found security work needed before public hosting. Today's local browser demonstration does not establish production readiness or a cloud deployment.

“Our most useful next steps are a labeled error and quality-flag dataset, repeated timings and prediction comparisons, a second domain, an expert/user review, and a tested secure deployment with complete integration checks. Continuous collection and additional language support are future scope.”

## 14. Closing

“The project demonstrates how supplied opinions can move through a repeatable, reviewable software workflow to a saved report. We can show its implementation, measurements, recovery behavior and limitations, and we preserve the evidence for a human reviewer. Thank you.”

## If something fails during the presentation

- Demo CSV does not load: paste the local CSV or the college example, then run. This workflow is independent of external APIs.
- Storage warning appears: explain it, export the in-memory report, and do not promise refresh persistence.
- Printing behaves differently: use the prepared synthetic PDF and explain that it is a saved browser-export example.
- A sentiment label is wrong: inspect cues, acknowledge the limitation, and distinguish local rules from the separately evaluated model.
- Server cannot start or laptop/browser fails: show the retained screenshots and saved report; explicitly call them recorded evidence, not a live run.
