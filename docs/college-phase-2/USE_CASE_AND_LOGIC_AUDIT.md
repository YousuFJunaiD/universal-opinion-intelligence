# Use-Case and Logic Audit

Audit date: 9 September 2026. “Ready” below means a prepared-text local demonstration, not validated deployment in that domain. Changing a use-case label does not train a model or establish domain accuracy.

## Use-case assessment

| Use case | Input required | Output and practical value | Limitation / prohibited inference | Small strengthening step | Showcase status |
|---|---|---|---|---|---|
| E-commerce review trust analysis | Review text; optional source ID; one record per review | Sentiment counts, battery/delivery/price mentions, duplicate/generic flags, report; helps organize evidence before comparison | No reviewer history, verified purchase, fraud labels, authenticity probability or purchase recommendation guarantee | Contrast a specific review with a generic one and show why both positive and negative text can be flagged | Ready with Product Reviews Demo; interpretation bounded |
| College feedback | De-identified open responses about facilities/teaching | Lab/classroom/faculty/placement/canteen mentions and review queue; useful for issue grouping | Short answers can be valid but flagged; survey design and response representativeness unknown; no staff/student ranking | Rehearse the anonymous example below and ask guide to review five output labels | Basic pasted-data path and lab grouping browser-tested; real college usefulness unvalidated |
| Hospital/clinic reviews | De-identified service-experience comments, no patient details | Waiting/staff/doctor/billing/cleanliness groups and text evidence | Experience sentiment cannot measure clinical competence, treatment quality or safety; no medical advice or patient triage | Use synthetic reception/waiting feedback only and explain the nonclinical scope | Generic pathway available; domain-specific validation/rehearsal needed |
| Brand complaint monitoring | Periodic manually supplied complaint/feedback snapshots | Support/refund/delivery/app groups, counts, export; useful for review meetings | Current flow has no timestamp comparison, deduplicated time series or continuous monitoring; neither accusation nor negative sentiment proves misconduct | Say “brand feedback snapshot”; later add dated comparisons with stable denominators | Ready with Brand Feedback Demo as a snapshot |
| Public scheme/government service | Curated/de-identified road/water/electricity/portal/application feedback | Keyword counts and evidence for an authorized reviewer | Sample is not public opinion of a constituency; no eligibility, benefit allocation or autonomous governance decisions | Two or more concrete portal/response comments; report source and collection window manually | Text workflow available; domain outcome validation absent |
| Public figure/topic/event | Pasted/exported comments with clear source context | Positive/negative/neutral distribution and policy/plan themes in supplied comments | No poll weighting, bot/fake detection, factual truth assessment, voter profiling or person trust rating | Lead with “these 15 synthetic comments”; inspect a neutral/error example | Ready with Public Figure Comments Demo; not a public-opinion poll |
| Survey response analysis | Open-ended question answers; keep question context | Repeatable text summary and full-row export | No Likert aggregation, respondent weighting, statistical inference, demographic subgroup testing or causal inference | One question per run; put question in report title and document response count | Generic workflow available; survey validity not tested |
| Support-ticket analysis | One de-identified feedback/resolution comment per case | Complaint and response/resolution keyword groups | Threads are not conversation-aware; no SLA integration, routing automation, case resolution or priority guarantee | Export one representative record per case and manually inspect the complaint queue | Ready as text-feedback demonstration; not a ticket-management system |
| Local-business reviews | Supplied shop/restaurant/service comments | Staff/service/price themes and evidence | No business rating or hygiene inspection; convenience sample bias | Use synthetic comments and label context | Generic workflow available; no separate bundled dataset |
| Social-media comments | Authorized pasted/exported records | Static sentiment and text-quality snapshot | No API feed, account network, platform coverage, bots, demographics or trend inference | Keep platform/source labels; disclose sampling | Generic workflow available; public-topic CSV illustrates the input class |

## Is it better than manually asking GPT or Claude?

Its defensible advantage is an implemented, repeatable workflow for a defined task. It already has record parsing, counts, fixed labels, named quality rules, evidence IDs, report snapshots and export. A manually assembled chat analysis requires the operator to manage those choices and outputs. The project makes them explicit and repeatable without a remote model dependency in the showcase.

This is not evidence of better language understanding. An LLM may interpret nuanced text better than this small lexical engine. A configured LLM application could also implement these workflows. No head-to-head accuracy, cost, speed, or usability study with GPT/Claude has been conducted. Say “we engineered a dedicated workflow” rather than “we replace or outperform general assistants.”

| Comparison dimension | What this project actually offers | Boundary |
|---|---|---|
| Repeatability | Same input/order and rules produce the same labels and flags | IDs/timestamps and schema versions can change; ML service configuration must be fixed |
| Dataset-level handling | Explicit rows, totals, 250-row browser cap and separate 5,000-row benchmark | The live page has not been evaluated at benchmark scale |
| Evidence | Row/source IDs, matched cues, flag reasons, full-row Markdown | Rule explanations are not causal explanations of RoBERTa |
| Saved output | Latest browser snapshot and export | Not tamper-proof, shared or automatically backed up |
| Consistent rules | Visible thresholds and priority logic | Consistency does not ensure accuracy or fairness |
| Domain UI | Six cards, ten choices, domain keyword groups | No separately trained domain classifiers |
| Automation | One run computes multiple summaries and builds a report | Ingestion is operator-triggered; no scheduled external collection |

## Important logical weaknesses

1. **Quality is not truth.** A detailed but false review may pass; a short genuine review may be flagged. Do not relabel unflagged text “verified” or “reliable.” The weak-evidence recommendation explicitly warns about this.
2. **Neutral has several meanings.** The local engine uses neutral for missing cues and tied cues as well as genuinely neutral statements. Never interpret the neutral count as measured public indifference.
3. **Duplicates still vote.** Sentiment denominators include every retained row. The flagger identifies possible repetition but does not correct representativeness. Deduplicated-versus-all reporting would be a separate sensitivity analysis.
4. **Keyword counts do not measure aspect sentiment.** A battery mention and negative label in the same sentence do not prove the battery was criticized. Groups count mentions only.
5. **Rules can mask each other.** Recommendations stop at the first applicable rule. A generic-review warning may conceal a high complaint percentage in the headline, though the counts remain visible.
6. **The bundled datasets are deliberately similar.** Each has 15 rows, several generic examples, and a duplicate. In the audited version all three produced seven flags and the same generic-review headline. This is a demonstration-design limitation, not evidence of real-world prevalence. Include the college example to show another response pattern; do not tune thresholds to manufacture variety.
7. **The product title does not change the input.** A healthcare card applied to unchanged phone reviews still analyzes phone reviews. Read the status and replace text before making a domain claim.

## Anonymous college example for rehearsal

Select College Feedback. Paste these synthetic statements, then run:

```text
The lab equipment is excellent and useful for practice.
The lab schedule is clear and helpful for assignments.
Faculty explained the practical steps with useful examples.
The canteen service is slow and the seating is poor.
The classroom has forty seats and two whiteboards.
The library opens at nine and closes at five.
```

Show that `Lab` appears in two records, the count is six, and the report title reflects College Feedback. Explain that faculty and canteen keywords are mentions, and any classification errors remain visible in the record evidence. These are synthetic rehearsal inputs, not an institutional survey or labeled evaluation dataset.
