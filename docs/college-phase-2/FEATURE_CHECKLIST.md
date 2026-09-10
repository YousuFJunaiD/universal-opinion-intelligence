# Feature Checklist — College Phase-II Showcase

## Completed for Showcase

- [x] Dedicated `/showcase` route.
- [x] Visible landing-page button for **Final Showcase Demo**.
- [x] Pasted text input.
- [x] CSV upload input.
- [x] Synthetic product review demo dataset.
- [x] Synthetic public figure/topic comments demo dataset.
- [x] Synthetic brand feedback demo dataset.
- [x] Browser-local sentiment analysis.
- [x] Suspicious/generic review flagging.
- [x] Transparent reasons and evidence for each flagged record.
- [x] Sentiment distribution dashboard.
- [x] Positive and negative evidence sections.
- [x] Repeated theme extraction.
- [x] Evidence-based recommendation category.
- [x] Print / Save PDF action through browser print.
- [x] Markdown report download.
- [x] localStorage persistence of the latest report after refresh.
- [x] No Supabase dependency for showcase mode.
- [x] No external API dependency for showcase mode.
- [x] Fallback engine metadata shown in the report.

## Partially Completed

- [ ] Public URL support is currently source-context support. The user should paste accessible public text if automatic collection is unavailable.
- [ ] Sentiment analysis is deterministic and transparent in showcase mode, not transformer-based by default.
- [ ] Review-quality flagging is heuristic and does not use verified purchase metadata or reviewer history.
- [ ] Browser print/export works; polished college PDF styling may still need manual formatting if submitted as a formal report PDF.

## Future Features

- [ ] More robust public web collection with clear source permissions.
- [ ] Optional FastAPI/VADER/RoBERTa path inside showcase mode.
- [ ] Verified purchase metadata if legally and ethically available.
- [ ] Reviewer-history and account-level signals if available from owned datasets.
- [ ] More advanced duplicate and near-duplicate detection.
- [ ] Multilingual sentiment handling.
- [ ] Sarcasm and mixed-language handling.
- [ ] Better chart visualizations for the printable report.
- [ ] Server-side report storage for multi-device use.

## Claim Boundary

The showcase supports:

- sentiment analysis;
- opinion intelligence;
- suspicious/generic review flagging;
- potentially low-quality review flagging;
- evidence-based suggestions;
- human-review support;
- report generation.

The showcase does not claim:

- confirmed fake-review detection;
- guaranteed product trust score;
- production-ready SaaS;
- universal public-data collection;
- legal/compliance verification;
- fully automated purchase decisions;
- perfect sentiment accuracy.
