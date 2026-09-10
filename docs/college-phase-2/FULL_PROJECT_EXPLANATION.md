# Full Project Explanation

Audit date: 9 September 2026. Priority: College Phase-II final showcase.

## 1. What the project is

**Universal Opinion Intelligence & Trust Analysis Platform** is a software project that turns supplied opinion records into sentiment summaries, text-quality flags, evidence, suggestions, and saved/exportable reports. Its strongest contribution is the implemented workflow and the separately benchmarked model-serving service.

Use this one-line description: **An AI-powered opinion-intelligence and automated reporting platform that organizes supplied feedback into sentiment, review-quality flags, evidence, and saved reports for human review.**

“Universal” is a project name describing intended breadth, not proof of universal accuracy, language coverage, or collection. “Trust analysis” means looking for text-quality concerns and examining supporting evidence. It is not an authenticity verdict, an identity check, or a numerical probability that a product or person can be trusted.

## 2. The problem it addresses

Reading feedback one record at a time makes it difficult to count patterns, retain the evidence behind a conclusion, and repeat the analysis consistently. This project provides a sequence from records to a reviewable report. It can reduce repetitive organizational work; actual time savings and improvements in human decisions have not been measured.

The current showcase is a local demonstration with bounded input. It is useful for showing software engineering and analytical workflow design. It is not an operational reputation-monitoring service or a trained authenticity detector.

## 3. Why it is broader than e-commerce

The fundamental input is text. A comment about a classroom, a service queue, a shop, or a public announcement can pass through the same input and reporting workflow. Domain choices change report context and keyword groups; they do not switch to separately validated domain models.

| Use case | Supplied input | Defensible output and boundary |
|---|---|---|
| Product reviews | Review text, optional source ID | Sentiment, product keyword mentions, quality flags; no purchase verification |
| College feedback | De-identified student responses | Lab/faculty/classroom themes for review; no evaluation of individual students |
| Healthcare reviews | De-identified service-experience comments | Waiting/staff/billing themes; no clinical-quality or treatment decision |
| Brand reputation | Curated feedback or complaint snapshot | Summary of these records; no continuous brand monitoring |
| Public services | Service feedback supplied by the operator | Road/water/portal themes; no population-level or governance decision |
| Public figure/topic/event | Pasted or exported public comments | Reactions in this sample; not a representative poll or character assessment |
| Surveys | Open-ended answers | Text summaries; no weighting, survey inference, or quantitative question analysis |
| Local businesses | Customer experience records | Service and price mentions; no business certification |
| Customer support | One feedback record per case | Recurring complaint themes; no ticket integration or automated resolution |
| Social media comments | Pasted/exported comments | A static comment snapshot; no live platform connection |

The first six appear as cards. All ten appear in the selector. Product, brand, and public-topic examples are bundled. Other domains need operator-supplied text and rehearsal before being presented as domain demonstrations.

## 4. The input pipeline

Open `/showcase`, choose a use case, and set the report title. Load a bundled CSV, upload a CSV, or paste one feedback record per line. CSV headers `text`, `review`, `comment`, `content`, and `feedback` identify the text column. Optional `id`/`record_id`/`recordid` and `source`/`platform`/`type` columns preserve provenance. A one-column text CSV is accepted. Quoted commas, doubled quotes, and quoted multiline text are supported.

`showcase-input-service.ts` assigns a unique internal row ID, retains a supplied source ID separately, trims text, and skips empty rows. It rejects malformed CSV, records exceeding 5,000 characters, more than 250 records, or more than 250,000 input characters. File upload is additionally limited to 250,000 bytes. These caps bound the browser workload; they are not measured capacity limits.

The optional URL is **source context only**. Entering a URL or a topic does not collect text. Existing starter input remains until replaced; selecting a card never generates evidence. The interface states that existing text is unchanged. Use a local server after installation; this is not an offline-installed application or a service worker demonstration.

## 5. Sentiment in the showcase

The showcase labels each record positive, negative, or neutral using a small English cue lexicon. More positive cues yields positive; more negative cues yields negative; ties and missing cues yield neutral. Version 1.1.0 adds limited negation handling over the preceding three words within a clause. For example, “not good” reverses the `good` cue. This does not solve sarcasm, contrast, subtle context, spelling variation, or mixed language.

The numerical rule score is computed from cue count and margin, capped at 0.95; neutral uses 0.52 or 0.60. These values are explicitly **uncalibrated heuristics**. A 95% rule score does not mean a 95% chance of being correct. Positive and negative cue lists are shown with examples. The local algorithm is distinct from the Python fallback and the ordinary dashboard baseline.

Domain keyword groups count how many records mention selected terms; a group appears at two or more records, with at most eight displayed. They are lexical mention groups, not trained aspect sentiment or semantic topic discovery. Multiple groups can include the same record.

## 6. Suspicious/generic review flagging

`review-quality-service.ts` accumulates transparent rule points:

| Trigger | Points |
|---|---:|
| Fewer than 18 text characters or at most three cleaned words | 2 |
| Common generic phrase or adjective-only short text | 2 |
| At most eight words with no recognized concrete term | 1 |
| Same normalized text as an earlier row | 4 |
| Otherwise near-duplicate token-set overlap of at least 0.86 | 3 |
| Excessive punctuation or repeated characters | 1 |
| Non-neutral sentiment, rule score at least 0.70, at most six words | 2 |
| Promotional-looking phrase | 2 |
| Repeated within-record phrase pattern | 2 |

A score of at least three flags a row for review. Scores of three–four are medium review priority; five or more are high; below three is low. These weights are not learned or calibrated against authenticity labels. Reasons, observed evidence, and a suggested manual action accompany each flag.

Near-duplicate matching uses token-set Jaccard overlap, not embeddings. Only later duplicate occurrences are marked relative to earlier ones, so row order can affect which example receives the flag. Duplicates remain in sentiment totals. Flagged rows are not automatically removed; unflagged rows are not verified. Legitimate brief feedback can be flagged, and misleading detailed text can escape flags.

## 7. Suggestions and report generation

The report uses deterministic rules in order: too few records/unflagged rows; high flagged share; negative share at least 45%; positive share at least 60% with negative share below 25%; otherwise mixed response/manual verification. A flagged share of at least 40% triggers the generic-review caution. These cutoffs are demonstration policies, not validated decision thresholds. The first applicable category wins, so a quality warning can take precedence over complaints.

The report includes a title, time, source context, record counts, percentages, selected evidence, quality explanations, repeated keywords, engine/version, and limitations. Screen and print examples are bounded and follow input order, not relevance ranking. The Markdown export additionally includes **every analyzed row**, its original source ID if present, cues, and quality evidence. User text is escaped in Markdown output. No generative AI writes these suggestions.

The Print / Save PDF button invokes browser printing; it does not call a server PDF generator. The separate full application's report-export endpoint records export metadata, which is not proof that a PDF was successfully saved by the browser.

## 8. Persistence

The latest complete showcase report is serialized under `college-phase-2-showcase-report-v1` in localStorage. On reload, the application validates its shape, basic counts, and row identities before restoring it and reconstructing its input. Storage exceptions are caught. If saving fails, the new report remains on screen and can be exported, while the status explicitly says it is not saved.

Only one latest snapshot is retained by this page. It is local to the browser profile and origin: `localhost` and `127.0.0.1`, different ports, and different browsers have different storage. Clearing site data loses it. It has no encryption layer, cross-device sync, account controls, or tamper-evident signature. Reset affects this showcase key, not the dashboard repositories. Export a copy before the presentation.

## 9. Demo datasets

The three files in `public/demo-data/` contain 15 synthetic records each. They deliberately mix detailed text, short generic comments, duplicates, praise, complaints, and promotional-looking phrases. They are demonstration inputs without gold sentiment/authenticity labels. They cannot validate accuracy or represent real consumers. They are served by the local Next.js server; no remote search or model download is needed during this flow.

## 10. The research/benchmark path

The separate FastAPI service implements VADER, an off-the-shelf `cardiffnlp/twitter-roberta-base-sentiment-latest` model, hybrid routing, and Python lexical fallback. Benchmark scripts call that service directly, while the Python fallback comparison runs in process. They do not benchmark the showcase page or the complete Next.js-to-database workflow.

The preferred evidence is a seed-20260622 proportional stratified sample without replacement: 5,000 from 14,640 usable Twitter US Airline records. It contains 807 positive, 3,135 negative, and 1,058 neutral labels. Selected IDs, usable-row indexes, and SHA-256 hashes are recorded. Sampled rows are written in original usable-row order after selection, which can still influence execution timing. Source hash: `ea94b23f41892b290dec3330bb8cf9cb6b8bc669eaae5f3a84c40f7b0de8f15e`. Sample hash: `098c2d24a372f99e5d232a360fc49ce3361513ef9870f20f41868929837316d6`.

| Component/configuration | Accuracy | Macro F1 | Evidence interpretation |
|---|---:|---:|---|
| RoBERTa | 0.8098 | 0.7587 | Strongest evaluated component on this sample |
| VADER | 0.4860 | 0.4528 | Faster, weaker on this sample |
| Python fallback | 0.2988 | 0.3018 | Continuity baseline; not the showcase classifier |
| Hybrid, threshold 0.85 | 0.8048 | 0.7524 | 4,612/5,000 records (92.24%) routed to RoBERTa |

Macro F1 is primary because class proportions are unequal. RoBERTa class F1 is 0.8878 negative, 0.7717 positive, and 0.6166 neutral. Neutral remains hardest. Accuracy is 4,049 correct out of 5,000, not a claim of universal performance.

Batch 16 was fastest in the recorded sweep: 2.9267 ms/record versus 9.8664 at batch 1 and 3.0871 at batch 32. Accuracy and macro F1 stayed identical in the saved results. The script did not persist or compare full prediction vectors, so prediction-by-prediction equality requires an added check. Timing is single-run, hardware-dependent evidence. Hybrid 0.85 recorded 4.5644 ms/record, slower than transformer batch 32 in that sweep. Routing 7.76% away from RoBERTa is not proof of large monetary savings.

## 11. Honest boundaries

There is one labeled benchmark dataset, one seed, no confidence intervals/significance tests, no user study, and no gold standard for review-quality flags. No model was fine-tuned here. Multilingual performance, sarcasm robustness, representative public opinion, streaming ingestion, and measured decision improvement are unvalidated. Architecture and container files exist, but a successful cloud deployment is not established by them.

Historical readiness documentation records six of nine checks as passed. Supabase/API end-to-end operation, cross-tenant authorization, and full-system report/PDF export remain open. Additional security gaps are documented in the technical audit; even completing nine checklist items would not itself certify a production system.

## 12. Realistic next scope

Before presentation, rehearse the three synthetic datasets, one anonymous college example, refresh, reset, and export. Prepare a screenshot/report fallback and explain the engine separation. After the showcase, prioritize a small human-labeled error set, flagger precision/recall, repeated timings, prediction hashes, a second dataset, and a user/expert review. For cloud evidence, add tested Compose/CI, bounded inference APIs, secure URL fetching, authorization tests, a deployment runbook, and one controlled deployment with observable health/failure behavior.

Evidence index: `src/app/showcase/page.tsx`; `src/lib/services/showcase-{config,input-service}.ts`; `review-quality-service.ts`; `ml-service/main.py`; `validation/results/*stratified_5000_seed_20260622*.json`; `TECHNICAL_ARCHITECTURE_AUDIT.md`; `FINAL_AUDIT_AND_VALIDATION_REPORT.md`.
