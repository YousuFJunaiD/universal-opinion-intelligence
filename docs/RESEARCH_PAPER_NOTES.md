# Universal Opinion Intelligence Platform: Research Paper Support Notes

## 1. Suggested Paper Title

Universal Opinion Intelligence Platform: A Full-Stack System for Text Feedback Analysis, Reporting, and Benchmark-Based Sentiment Evaluation

## 2. Abstract Support

This project presents a full-stack opinion intelligence platform that transforms unstructured text feedback into structured insights. The system supports project-based data intake, dataset preparation, baseline sentiment analysis, multi-dimensional opinion analysis, evidence-driven recommendations, report generation, and benchmark-based evaluation. It uses a replaceable model-adapter architecture with deterministic rule-based analysis and a FastAPI VADER baseline, while remaining ready for transformer-based models such as BERT, RoBERTa, and DistilBERT. Evaluation metrics are calculated only from user-provided labelled benchmark data.

## 3. Problem Statement

Large volumes of public and private textual feedback are difficult to analyze manually. Organizations need systems that can collect, clean, analyze, summarize, and report opinion trends transparently. Many existing systems are either narrow in scope, expensive, opaque, or dependent on models without clear evaluation support.

The proposed platform solves this by combining full-stack software architecture with baseline NLP analysis, transparent evidence records, report generation, and benchmark evaluation support.

## 4. Research Objectives

- Design a scalable platform for opinion analysis across multiple text-data domains.
- Implement a structured workflow from project creation to report export.
- Provide deterministic baseline sentiment and deep-analysis modules.
- Integrate a FastAPI ML service using VADER as a lightweight NLP baseline.
- Create a provider architecture that can support future transformer-based models.
- Generate evidence-backed recommendations without hallucinated outputs.
- Support benchmark evaluation using labelled datasets.
- Calculate real accuracy, precision, recall, F1, per-class metrics, and confusion matrix values.

## 5. Methodology

### System Design

The platform follows a modular architecture:

1. Next.js frontend for user workflow and dashboard interaction.
2. Service layer for data preparation, analysis, recommendations, reports, and evaluation.
3. Repository layer for localStorage and PostgreSQL-ready persistence.
4. API layer for backend migration and user-scoped data access.
5. FastAPI ML service for replaceable external NLP inference.

### Data Processing

Datasets are created from pasted text or CSV upload. The preparation stage performs:

- whitespace trimming
- blank row removal
- repeated-space normalization
- exact duplicate removal
- quality metric calculation
- language placeholder assignment as `unknown`

### Sentiment Analysis

Two sentiment baselines are available:

| Baseline | Description |
| --- | --- |
| Rule-based baseline | Deterministic keyword scoring inside the Next.js application |
| VADER baseline | Lightweight lexical NLP baseline served through FastAPI |

The FastAPI adapter includes timeout/error handling and falls back to the local rule-based engine when unavailable.

### Multi-Dimensional Analysis

Deep analysis currently uses deterministic lexical rules for:

- emotion labels: joy, anger, sadness, fear, trust, surprise, neutral
- stance labels: supportive, opposing, questioning, neutral
- aspect detection
- risk signals

This module is intentionally replaceable by future ML models.

## 6. Benchmark Evaluation Workflow

The benchmark evaluation module accepts user-provided labelled records:

```csv
text,expectedSentiment
"The product is excellent and helpful",positive
"The app is slow and broken",negative
"The delivery arrived yesterday",neutral
```

The system runs the active sentiment provider and compares predicted labels against expected labels.

### Metrics Calculated

- Accuracy
- Macro precision
- Macro recall
- Macro F1 score
- Per-class precision, recall, and F1
- Confusion matrix
- Wrong prediction examples

No default or fake benchmark scores are included. The reported metrics depend entirely on the benchmark dataset supplied by the evaluator.

## 7. Metric Definitions

### Accuracy

Accuracy is the proportion of correctly predicted records:

```text
Accuracy = Correct Predictions / Total Predictions
```

### Precision

Precision measures how many records predicted as a class actually belong to that class:

```text
Precision = True Positive / (True Positive + False Positive)
```

### Recall

Recall measures how many records of a class were correctly identified:

```text
Recall = True Positive / (True Positive + False Negative)
```

### F1 Score

F1 is the harmonic mean of precision and recall:

```text
F1 = 2 * Precision * Recall / (Precision + Recall)
```

### Confusion Matrix

The confusion matrix compares expected labels against predicted labels. Rows represent expected labels, and columns represent predicted labels.

## 8. How to Report Results in the Paper

Use the benchmark evaluation output after running a real labelled dataset.

Suggested table:

| Metric | Value |
| --- | --- |
| Accuracy | Use exported result |
| Macro Precision | Use exported result |
| Macro Recall | Use exported result |
| Macro F1 Score | Use exported result |

Suggested per-class table:

| Class | Precision | Recall | F1 | Support |
| --- | --- | --- | --- | --- |
| Positive | Use exported result | Use exported result | Use exported result | Use exported result |
| Negative | Use exported result | Use exported result | Use exported result | Use exported result |
| Neutral | Use exported result | Use exported result | Use exported result | Use exported result |

Suggested confusion matrix:

| Expected / Predicted | Positive | Negative | Neutral |
| --- | --- | --- | --- |
| Positive | Use exported result | Use exported result | Use exported result |
| Negative | Use exported result | Use exported result | Use exported result |
| Neutral | Use exported result | Use exported result | Use exported result |

## 9. Evidence and Interpretability

The platform supports interpretability through:

- per-record sentiment labels
- confidence values
- positive/negative keyword matches in baseline mode
- evidence records in recommendation outputs
- top positive and negative record sections
- wrong-prediction table in benchmark evaluation

This allows the paper to discuss not only quantitative metrics but also qualitative error analysis.

## 10. Limitations

The current implementation has important limitations:

- Rule-based sentiment cannot reliably understand sarcasm, irony, negation, or domain-specific meaning.
- VADER is a lexical baseline, not a transformer model.
- Deep analysis is currently deterministic and keyword-based.
- Language detection is a placeholder marked as `unknown`.
- Real social media API ingestion is not included.
- Benchmark quality depends on the size and correctness of user-provided labels.
- PDF export uses browser print rather than server-side PDF generation.

## 11. Future Work

Potential future improvements:

- Add transformer-based sentiment models such as BERT, RoBERTa, or DistilBERT.
- Add multilingual language detection and translation-aware analysis.
- Add real social media and review-platform API connectors.
- Add human-in-the-loop label correction for benchmark datasets.
- Add model version comparison across multiple benchmark runs.
- Add server-side PDF generation.
- Add production invitation flow for workspace members.
- Add more advanced explainability methods for ML-based predictions.

## 12. Suggested Diagrams

Include these diagrams in the final paper:

- System architecture diagram
- Data flow diagram
- Entity relationship diagram
- ML provider adapter diagram
- Benchmark evaluation workflow diagram
- User flow diagram

## 13. Screenshot Placeholders

- `[Screenshot Placeholder: Evaluation page before running benchmark]`
- `[Screenshot Placeholder: Benchmark CSV upload/paste input]`
- `[Screenshot Placeholder: Metrics cards after evaluation]`
- `[Screenshot Placeholder: Confusion matrix table]`
- `[Screenshot Placeholder: Wrong predictions table]`
- `[Screenshot Placeholder: Exported JSON/CSV result sample]`

## 14. Ethics and Responsible Use

Opinion intelligence systems can influence organizational decisions. The platform should be used with caution, especially for political/public opinion, employee feedback, or sensitive communities. Results from baseline models should be treated as decision support rather than absolute truth. Evaluation should be performed with representative labelled datasets before using model outputs for high-impact decisions.

## 15. Research Paper Status

The platform provides a working foundation for research reporting. The paper can describe the system implementation, baseline models, architecture, and evaluation method immediately. Numerical performance results should be added only after running a real labelled benchmark dataset through `/dashboard/evaluation`.
