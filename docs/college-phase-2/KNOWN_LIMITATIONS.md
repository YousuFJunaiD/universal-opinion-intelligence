# Known Limitations — College Phase-II Showcase

## Suspicious/Generic Review Flagging

The system does not confirm fake reviews.

It only flags potentially low-quality review patterns such as:

- very short one-line reviews;
- generic praise or complaint without details;
- duplicate or near-duplicate text;
- extreme sentiment with little supporting explanation;
- promotional-looking wording;
- repeated phrases;
- no concrete product, service, or topic term in a short record.

These flags should be treated as **manual review prompts**, not final accusations.

## Data Limitations

- Showcase demo datasets are synthetic.
- User-uploaded CSV quality depends on the uploaded file.
- Pasted text may be incomplete or biased.
- No reviewer account metadata is used.
- No verified purchase metadata is used.
- No order history, timestamps, platform trust signals, or reviewer behavior signals are used.

## Public Collection Limitations

- Public URL/topic support depends on accessible public text and configured APIs.
- The showcase does not bypass login.
- The showcase does not bypass CAPTCHA.
- The showcase does not scrape private content.
- If public collection is unavailable, pasted text and CSV input remain the reliable fallback.

## Sentiment Limitations

- Showcase sentiment analysis uses local deterministic rules for reliability.
- Sarcasm may be misclassified.
- Mixed-language comments may be misclassified.
- Context-heavy public comments may be simplified.
- Very short records may not contain enough evidence for reliable sentiment.

## Report Limitations

- The recommendation is evidence-based but not a guaranteed decision.
- The product, brand, person, or topic should still be manually reviewed.
- Browser print/export depends on browser print settings.
- localStorage persistence is browser-specific and not shared across devices.

## Deployment Limitations

- Showcase mode is designed for college demonstration.
- It should not be described as production-ready SaaS.
- It does not prove full security, legal compliance, or large-scale reliability.
