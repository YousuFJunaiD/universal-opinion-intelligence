# 3–5 Minute Demo Script — College Phase-II Showcase

## Opening

Good morning respected faculty members and evaluators. Our project is titled **Universal Opinion Intelligence Platform**. It is an applied AI system that analyses user-provided or public opinion text and converts it into sentiment insights, suspicious/generic review flags, evidence-based suggestions, and a report.

For the final showcase, we created a stable demo mode at:

```text
/showcase
```

This mode works locally and does not require Supabase, FastAPI, search APIs, or external scraping.

## Demo Step 1 — Load Data

I will start with the **Product Reviews Demo** dataset. This dataset is synthetic and safe to distribute. It includes detailed positive reviews, negative complaints, neutral/mixed reviews, generic one-line reviews, duplicate text, and promotional-looking text.

I click **Product Reviews Demo**, then click **Run Analysis**.

## Demo Step 2 — Sentiment Output

The system classifies each record as positive, negative, or neutral using transparent local sentiment rules in showcase mode. The dashboard shows total records, positive count, negative count, and suspicious/generic review count.

The goal is not to claim perfect sentiment accuracy. The goal is to show a working end-to-end opinion-analysis workflow.

## Demo Step 3 — Suspicious/Generic Review Flagging

Now I will show the suspicious/generic review section. The system flags reviews that are very short, repeated, promotional-looking, adjective-only, or lacking concrete product details.

Important: we do **not** claim these reviews are fake. We call them **potentially generic** or **low-detail reviews** that need manual review.

## Demo Step 4 — Evidence and Themes

The dashboard separates positive and negative evidence. It also highlights repeated themes such as delivery, support, refund, battery, price, or quality.

This helps a user quickly understand what people praise and what they complain about.

## Demo Step 5 — Recommendation and Report

The system generates a final recommendation category, such as:

- Strong positive signal;
- Mixed public response;
- High complaint concentration;
- Many generic reviews detected;
- Too little reliable evidence.

Then I can print the report or download a Markdown report. I will also refresh the page to show that the latest report is saved in browser localStorage and remains visible.

## Closing

This Phase-II version demonstrates a complete, repeatable showcase flow:

```text
input text or CSV → sentiment analysis → suspicious/generic flagging → insights → suggestions → report
```

The current system supports human review and college demonstration. Future work can improve model accuracy, public data collection, multilingual handling, verified purchase metadata, and stronger backend deployment.
