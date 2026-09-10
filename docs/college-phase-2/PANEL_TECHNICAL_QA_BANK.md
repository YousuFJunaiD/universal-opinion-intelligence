# Panel Technical Q&A Bank

Audit date: 9 September 2026. Use these as speaking answers, not scripts to memorize without understanding the implementation. Evidence: source files and `FINAL_AUDIT_AND_VALIDATION_REPORT.md`.

## Purpose and positioning

### 1. What does this project do?

It turns supplied review, feedback and comment records into sentiment summaries, text-quality flags, evidence and saved/exportable reports. The main engineering contribution is the complete workflow and separate evaluation of sentiment-serving components.

### 2. Why is it needed?

The repeated work is organizing many records consistently, counting patterns, preserving evidence and producing a report. We implement that process. We have not yet measured organizational time savings.

### 3. Why not ask GPT or Claude?

This project provides a defined interface, record counts, consistent rules, evidence IDs, persistence and export without having to construct that workflow for each run. We have not shown better language understanding or lower cost than those assistants, and an LLM application could implement similar features.

### 4. Is it limited to e-commerce?

No. The same supplied-text workflow can process student feedback, service experiences, public comments, surveys and support feedback. Domain choices change labels and keyword groups; accuracy across those domains is not established by our airline benchmark.

### 5. Why call it “Universal”?

It is the project name and expresses intended breadth of use cases. It is not a technical claim of universal source access, language support or accuracy.

### 6. What does “trust analysis” mean?

We inspect text quality and evidence before a human makes a judgment. There is no guaranteed product/person trust score or verification of factual truth.

### 7. What is sentiment analysis?

It assigns an opinion-polarity label, here positive, negative or neutral, to a text record. That label summarizes language and does not prove that the underlying claim is true.

### 8. What is opinion intelligence beyond sentiment?

In this project it includes organizing records, counting sentiment and keyword patterns, flagging low-detail or repeated wording, showing evidence, and producing a reviewable report. “Intelligence” refers to the workflow output, not verified decision quality.

## Live inference and quality flags

### 9. Which model is running on this page?

`/showcase` runs `browser-rule-based-showcase` version 1.1.0, a deterministic English lexical engine. The separate FastAPI service supports VADER and RoBERTa; its benchmark metrics do not apply to this page.

### 10. Why use deterministic rules in the showcase?

They allow the complete local workflow to run without network models, a database, or API credentials. This improves demonstration independence, while language accuracy remains limited and must be presented honestly.

### 11. How does the local classifier decide a label?

It counts positive and negative cues, applies limited local negation, and compares the counts. Ties and missing cues become neutral. Matched cues are available for inspection.

### 12. What does the rule score mean?

It is an uncalibrated function of cue counts and their margin, capped at 0.95. It is not a measured probability of a correct prediction. The UI calls it a rule score.

### 13. Can it understand sarcasm?

Not reliably. Statements such as “great, another delay” may be misinterpreted by lexical rules. We retain the text so a person can inspect such cases.

### 14. How is negation handled?

The showcase checks a small list of negation words within the preceding three words in the same clause, with a `not only` exception. It handles basic examples but does not implement full syntax or context modeling.

### 15. Does neutral mean no opinion?

Not necessarily. In the local engine it can also mean no recognized cue or a tie. We cannot interpret it as public indifference or agreement.

### 16. Does the project detect fake reviews?

No. It flags suspicious/generic text patterns for manual review. A flag is neither proof of deception nor proof of reviewer identity.

### 17. Which patterns trigger a quality flag?

Short/low-detail text, generic phrases, missing concrete terms, duplicates, high token overlap, promotional wording, repeated punctuation/characters, repeated phrases, and strong short sentiment. The output shows the trigger reasons and observed evidence.

### 18. Why might a genuine short review be flagged?

A genuine review can still provide little supporting detail. The flag concerns the strength of text evidence, not authenticity. This false-positive risk is explicitly documented.

### 19. Do you use reviewer accounts or purchase records?

No. The current input is text plus optional source context. Verified purchase, account history, device/network patterns and order metadata are absent.

### 20. How do you detect near duplicates?

We normalize English text and compare sets of tokens using Jaccard overlap. At least four tokens and overlap at least 0.86 can trigger a near-duplicate signal. It is a lexical similarity heuristic, not a trained semantic detector.

### 21. Why is only a later duplicate flagged?

The implementation compares a row with earlier rows and cites the earlier matching ID. This preserves a simple explanation but makes the chosen flagged occurrence order-dependent.

### 22. Do you remove flagged records?

No. All nonempty accepted rows remain in sentiment totals and in the full Markdown export. The report explains that duplicates can influence counts. Unflagged rows are not verified.

### 23. Is review risk the same as product risk?

No. The low/medium/high bands represent heuristic priority for reviewing the text. They do not rate product safety, a doctor's competence or a person's trustworthiness.

### 24. Do keyword groups provide aspect sentiment?

No. They count records mentioning terms such as battery, lab or billing. The system has not validated which sentiment belongs to each aspect of a mixed statement.

## Benchmark evidence

### 25. What is VADER?

VADER is a lexicon/rule-based sentiment analyzer used by our FastAPI baseline. Its compound score is converted to the three labels; our wrapper adds metadata and a heuristic confidence value for routing.

### 26. What is RoBERTa in your project?

It is an existing pretrained transformer sentiment model loaded through the Transformers/PyTorch stack. We used `cardiffnlp/twitter-roberta-base-sentiment-latest`; we did not design or fine-tune the model.

### 27. What benchmark did you use?

The preferred evidence is 5,000 proportionally stratified records selected without replacement from 14,640 usable Twitter US Airline records using seed 20260622. A manifest preserves IDs, usable-row indexes, class counts and hashes.

### 28. What is the class distribution?

There are 807 positive, 3,135 negative and 1,058 neutral records. Negative records are the majority, so accuracy alone can conceal poor behavior on minority classes.

### 29. What were the main results?

RoBERTa achieved 0.8098 accuracy and 0.7587 macro F1; VADER 0.4860 and 0.4528; Python fallback 0.2988 and 0.3018. Those are component comparisons on that fixed sample, not live-showcase accuracy.

### 30. What is accuracy?

Accuracy is the fraction of records whose predicted label equals the reference label. RoBERTa correctly classified 4,049 of the 5,000 benchmark records.

### 31. What are precision, recall and F1?

Precision measures how often predictions of a class are correct; recall measures how much of that true class is recovered. F1 is their harmonic mean. Each describes a different error trade-off.

### 32. Why is macro F1 primary?

It averages the F1 values of the three classes equally rather than letting the largest class dominate. That is useful for our imbalanced sample, though it should still be read with per-class results and the confusion matrix.

### 33. Which class was hardest?

Neutral had F1 0.6166, versus 0.7717 positive and 0.8878 negative in the RoBERTa benchmark. This is evidence that ambiguity and neutrality remain difficult in this sample.

### 34. Why not say you outperform previous research?

We did not run all prior systems on the same dataset, split, hardware and protocol. The evidence supports only the within-experiment comparison and the engineering contribution, not a state-of-the-art claim.

### 35. What did batching improve?

It changed recorded throughput. Batch 16 was fastest in the sweep at 2.9267 ms/record, compared with 9.8664 for batch 1. Accuracy and macro F1 stayed the same in saved results; exact prediction-vector equality still needs a recorded assertion.

### 36. Is batch 16 or 32 the universal best setting?

No. Batch 16 was fastest only in this recorded rerun. Timing depends on hardware, text lengths, load and warm state, and repetitions are still needed.

### 37. What is hybrid routing?

FastAPI scores with VADER first. Confident non-neutral records without mixed lexical signals stay on VADER; other records go to RoBERTa. Results return in original order with route counts.

### 38. What does threshold 0.85 achieve?

It achieved 0.8048 accuracy and 0.7524 macro F1 on the preferred sample, routing 4,612 records, or 92.24%, to RoBERTa. Its quality approached transformer-only results, but very little inference was avoided.

### 39. Is hybrid definitely cheaper or faster?

No. Monetary cost was not measured. Hybrid 0.85 recorded 4.5644 ms/record, compared with 3.0871 for transformer batch 32 in the sweep. Repeated controlled tests are needed before adopting it for efficiency.

### 40. What was the routing-count bug?

Earlier benchmark metadata only reflected the last HTTP chunk. The helper now sums VADER/transformer counts across all chunks; in the preferred run each threshold accounts for all 5,000 records.

### 41. Are results statistically significant and generalizable?

No significance tests or confidence intervals have been reported, and we have one dataset and one seed. We present observed results with those limitations; a second dataset and repeated runs are future work.

### 42. Did you measure cold start?

The preferred batch run started with the model already loaded, so its first probe is not a cold-start measure. Historical cold-start information is separate and should not be mixed into this run.

## Architecture, persistence and deployment

### 43. What technologies are used?

Next.js App Router, React, TypeScript and Tailwind form the frontend. Next.js route handlers and services/repositories support the broader application; FastAPI/Pydantic serve ML components; Supabase/PostgreSQL is the designed server persistence path.

### 44. Why use FastAPI separately?

It provides a Python boundary for model dependencies and inference while the web interface stays in TypeScript. That permits separate serving configuration and measurement, though integrated deployment still needs testing.

### 45. What happens if FastAPI is down?

The showcase never calls it, so it continues locally. In the server adapter path, request errors can return a labeled lexical fallback; within FastAPI, unavailable transformer initialization can fall back to VADER. We do not claim every infrastructure failure is handled.

### 46. What is localStorage?

It is browser-origin storage used here for the latest serialized showcase snapshot. It survives a reload under ordinary settings, but it is not an encrypted database, shared storage or a guaranteed backup.

### 47. Why does the showcase not need Supabase?

It uses local state and browser storage directly. Supabase belongs to the broader multi-user persistence design, whose live integration and authorization checks remain open.

### 48. What happens if storage is full or disabled?

The interface reports that saving failed and keeps the current report available for download or print. It avoids claiming that an unsaved report will survive refresh.

### 49. How is the report generated?

A deterministic builder assembles the title, counts, evidence, quality reasons, keyword groups, policy-based suggestion, engine/version and limitations. Markdown includes every row; the printable view shows selected examples.

### 50. Is PDF export automated on the server?

No. The browser print workflow produces the PDF when saved. We tested invocation and generated a synthetic browser PDF; full API/database export validation remains a different open check.

### 51. Can it scrape every public website?

No. `/showcase` does no scraping. The broader application has limited HTML extraction and optional source discovery, but no universal collection or complete security/compliance assurance.

### 52. What legal or privacy constraints apply to collection?

The application does not establish permission to collect or publish data. For demonstration we use synthetic or authorized, de-identified text; actual source access, terms, permissions and data handling must be reviewed separately. We do not bypass login or access controls.

### 53. How could continuous monitoring be added?

Through approved connectors, timestamps, a bounded queue, workers, retries, deduplication, retention controls and sustained validation. This is future architecture, not current functionality.

### 54. How would cloud deployment work?

A Next.js service would call a private FastAPI service and a scoped database behind appropriate ingress and secret management. Container definitions exist, but there is no cloud deployment proof in this audit. Public exposure also requires the documented security fixes.

### 55. What does Docker prove here?

It specifies intended runtime packaging. We added build-context exclusions for local credentials and data, but have not claimed a successful container build/run or hosted deployment from those files alone.

### 56. Are the nine production checks complete?

Historical documentation records six passed and three open: Supabase/API E2E, cross-tenant authorization, and full-system report/PDF export. The new local showcase tests do not close those integrated checks. Additional audit gaps also remain.

### 57. Is this secure enough for patient/student data?

The local showcase is not validated for sensitive data handling. Use synthetic or de-identified authorized feedback. It must not make clinical, academic, governance or other high-impact decisions autonomously.

### 58. What makes the project original and engineering-focused?

The project combines explicit workflow design, interchangeable model components, benchmark automation, transparent quality rules, persistence abstractions, evidence and reporting. The contribution is implementation/integration/evaluation; we do not claim a new sentiment model or unique invention of these patterns.

### 59. What is the most useful next improvement?

For analytical quality, a small labeled error/quality-flag dataset and a user/expert study. For engineering maturity, a tested deployment and complete API/auth/persistence validation. Neither should be rushed into the final local demonstration.

### 60. How does this fit your resume?

It demonstrates an AI-enabled workflow, model-serving integration, reproducible evaluation, failure handling and reporting. Cloud claims must wait for actual deployment evidence, and the student should describe their own contribution within the team accurately.
