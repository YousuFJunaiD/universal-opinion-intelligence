# Final Showcase Guide — College Phase-II

## Project Summary

The Universal Opinion Intelligence Platform is a college Phase-II applied AI system for analysing opinion text from products, brands, public topics, public figures, pasted comments, and CSV datasets.

For the final showcase, the reliable demo path is:

```text
/showcase
```

This page runs fully in browser-local showcase mode. It does not require Supabase, FastAPI, search APIs, external scraping, or internet access after the app loads.

## What the Showcase Demonstrates

The showcase page can:

- accept pasted reviews or comments;
- load synthetic demo CSV datasets;
- upload a CSV from the evaluator or presenter;
- classify sentiment as positive, negative, or neutral using transparent local rules;
- flag suspicious/generic or potentially low-quality reviews using heuristics;
- show sentiment distribution and evidence examples;
- show suspicious/generic review examples with reasons;
- identify repeated themes;
- generate evidence-based suggestions;
- create a print-ready report;
- persist the latest report in browser localStorage after refresh.

## How to Run

Use local/demo-safe mode so the college showcase does not depend on Supabase.

```bash
npm run dev
```

Open:

```text
http://localhost:3000/showcase
```

If a production build is needed and `.env.local` causes database access during prerendering, use:

```bash
env DATA_ACCESS_MODE=local NEXT_PUBLIC_DATA_MODE=local AUTH_MODE=dev ANALYSIS_PROVIDER=local FASTAPI_ML_URL=http://127.0.0.1:8000 DATABASE_URL= NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= SUPABASE_SERVICE_ROLE_KEY= npm run build
```

## Recommended First Demo Dataset

Use:

```text
Product Reviews Demo
```

File:

```text
public/demo-data/demo_product_reviews.csv
```

This is the best first demo because it clearly shows:

- positive reviews;
- negative complaints;
- neutral/mixed product feedback;
- generic one-line reviews;
- repeated review text;
- promotional-looking text;
- final recommendation and print-ready report.

## Demo Flow

1. Open `/showcase`.
2. Click **Product Reviews Demo**.
3. Click **Run Analysis**.
4. Show the sentiment counts.
5. Show top positive and negative evidence.
6. Show the suspicious/generic review section.
7. Explain that this is not fake-review detection; it is transparent low-quality review flagging.
8. Show repeated themes.
9. Show final recommendation.
10. Click **Print / Save PDF** or **Download Markdown**.
11. Refresh the page and show that the latest report reloads from localStorage.

## Fallback Plan

If internet, APIs, Supabase, or FastAPI are not working:

- use `/showcase`;
- select one of the demo datasets;
- or paste reviews/comments directly;
- run analysis locally;
- print or download the report.

The showcase should not fail because external search or backend services are unavailable.

## Public Data Collection Rules

For public URLs or public topics:

- use only public accessible text;
- do not bypass login;
- do not bypass CAPTCHA;
- do not scrape private content;
- do not claim unsupported platforms are supported;
- if public collection is unavailable, paste public text manually or use CSV input.

## Claim Boundary

Use these phrases:

- sentiment analysis;
- opinion intelligence;
- suspicious/generic review flagging;
- potentially low-quality review flagging;
- evidence-based suggestions;
- human-review support;
- report generation.

Avoid these claims:

- confirmed fake-review detection;
- guaranteed product trust score;
- production-ready SaaS;
- universal public-data collection;
- fully automated purchase decision;
- perfect sentiment accuracy.
