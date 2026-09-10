# Loopholes and Weaknesses Report

Audit date: 9 September 2026. This is the identified weakness register for the inspected scope. It does not claim exhaustive detection of all bugs or security vulnerabilities.

## Panel-facing weakness register

| Weakness / why it matters | How the panel may ask | Honest answer | Fix now or later / lowest-effort improvement |
|---|---|---|---|
| Authenticity is not labeled or verified | “Do you detect fake reviews?” | “We flag generic, repeated and promotional-looking wording for manual review. We do not determine authenticity.” | Now: explicit UI/report language implemented; later obtain suitable metadata and labeled data |
| No purchase/account/reviewer history | “How do you know the reviewer used the product?” | “We cannot know from text alone; no verified-purchase or account signal is used.” | Disclose now; optional owned metadata later |
| Generic flags may penalize legitimate short answers | “Is ‘good service’ necessarily suspicious?” | “No. It is low-detail evidence, not proof of deception.” | Now show both short praise and short complaint; later estimate flagger precision/recall |
| Detailed fabricated content can escape flags | “Can someone bypass your rules?” | “Yes. Rule triggers are limited; unflagged text is not verified.” | Disclose now; adversarial labeled review later |
| No calibration of score/weights | “Why is this confidence 95%?” | “It is a capped rule-strength formula, not an accuracy probability.” | Now renamed rule score; assess calibration later |
| Lexical engine differs from research model | “Is the live app 80.98% accurate?” | “That result belongs to RoBERTa on the airline sample, not this page.” | Now show engine metadata; optional tested service mode later |
| Three fallback implementations differ | “Is fallback the same everywhere?” | “The showcase, ordinary dashboard and Python service use different lexical implementations.” | Now document paths; shared contracts and parity tests later |
| Sarcasm/context still fail | “What about ‘great, another delay’?” | “The current local rules can misread sarcasm and contrast; human inspection is required.” | Show a failure example now; no rushed language-model swap |
| Basic negation is limited | “Does ‘not only good’ work?” | “A small exception exists, but only local three-word context is modeled, not full grammar.” | Regression examples added; broader error corpus later |
| English-centric normalization | “Will Kannada, Hindi or mixed text work?” | “The input may display, but sentiment and quality rules are not validated for those languages.” | Disclose; never infer language support from Unicode display |
| Neutral includes uncertainty/ties | “Does neutral mean the public is undecided?” | “No. It may mean no recognized cues or equal positive/negative cues.” | Now show neutral/tied label and report limitation |
| Duplicates influence sentiment totals | “Do repeated reviews inflate results?” | “They can. We retain them and show flags; we have not implemented a validated reweighting policy.” | Disclose; all-versus-deduplicated comparison later |
| Duplicate flags depend on order | “Why is the second copy flagged, not the first?” | “It is matched against previous rows; the flag references earlier evidence.” | Disclose; cluster-level annotations later |
| Pairwise duplicate comparisons are quadratic | “Can you process a million rows?” | “Not in this browser workflow. It is capped at 250 records.” | Cap implemented now; worker/indexed methods later |
| Non-semantic keyword groups | “Is this aspect-based sentiment?” | “These are domain keyword mentions. They do not attribute sentiment to each aspect.” | Explicit labeling now; validated aspect model later |
| Recommendation cutoffs arbitrary | “Why 40%, 45% or 60%?” | “They are transparent demonstration rules, not statistically optimized thresholds.” | Document order now; validate with reviewers later |
| Quality headline can mask complaints | “Why does a negative dataset say generic reviews?” | “The quality check runs first. Complaint counts remain visible.” | Explain now; multiple independent caution labels later |
| All demo sets trigger same category | “Did you hard-code the answer?” | “The CSVs share a synthetic pattern; the function computes counts. We can paste a different set and rerun.” | Use college example now; diverse independently authored demos later |
| URL field does not fetch | “Will this URL retrieve live comments?” | “On `/showcase` it is context only. Actual records must be pasted or uploaded.” | Now explicit field label; do not demonstrate live scraping |
| Public page text is not all opinions | “Is page text equivalent to user reviews?” | “No. The broader HTML extractor can include descriptions and body text; source type matters.” | Disclose; select/deduplicate actual opinion records later |
| Collection permissions are not verified | “Is scraping legally approved?” | “The software does not establish permission or compliance. We use synthetic or authorized text for the showcase.” | Synthetic data now; provider/source review before collecting real material |
| Domain transfer untested | “Does airline accuracy apply to hospitals?” | “No. The model comparison is limited to the airline sample.” | Disclose; second domain and careful annotations later |
| One seed/dataset | “How reliable is the result?” | “It is a reproducible point estimate, not a universal result.” | Use correct sample; repeated seeds/second dataset later |
| No uncertainty/significance | “Is the difference statistically significant?” | “No significance test or confidence interval has been reported.” | Disclose; bootstrap intervals/paired tests later |
| Identical metrics versus identical predictions | “How do you know batching kept every label?” | “Saved aggregate metrics agree; the script did not retain/compare every prediction. We tightened that claim.” | Claim ledger corrected now; add prediction hashes in rerun |
| Hybrid savings overstated by old prose | “Does threshold 0.85 save much?” | “Only 7.76% avoid RoBERTa. It was slower than transformer batch 32 in the recorded sweep.” | Stale checklist wording corrected; repeat timings later |
| No calibration/user study | “Did organizations make better decisions?” | “We demonstrate the workflow, not measured decision improvement.” | Advisor usability review now; formal user/expert study later |
| localStorage is not durable server persistence | “What happens after browser data is cleared?” | “The snapshot is lost. Markdown/PDF is the backup.” | Error recovery and exports now; server persistence later |
| Private information in text/report | “Can I upload patient or student records?” | “Use de-identified authorized feedback. The demo has no clinical/privacy certification or access-control layer.” | Privacy note and synthetic examples now |
| Malformed CSV/source IDs | “What if IDs repeat or quotes break?” | “Rows have independent internal IDs; malformed CSV produces a message.” | Fixed and regression-tested now |
| Storage denied/full | “Will the demo freeze?” | “The report remains available in memory, and the status says it was not saved.” | Fixed and browser-tested now |
| Stored JSON tampering | “Can a saved result be edited?” | “Yes. We check shape/basic invariants, not cryptographic authenticity.” | Validation fixed now; signed audit trails later if required |
| Last report versus current input | “Did this report analyze the text I just changed?” | “It is the last completed snapshot until Run Analysis succeeds; check its title.” | Now explicit snapshot/status wording and matching restore |
| Supabase E2E/auth unproven | “Is this secure multi-user SaaS?” | “No. The code has scoping and migrations, but live persistence and cross-tenant tests remain open.” | Keep disabled now; two-user integration suite later |
| Direct ML service lacks limits/auth | “What stops an oversized inference request?” | “The Next.js safeguards do not protect a directly exposed FastAPI service.” | Keep private now; add direct caps/auth/concurrency limits before hosting |
| URL fetch guard can follow unsafe redirect first | “Are internal network requests prevented?” | “Not comprehensively. The source audit found checks after redirect-following and no DNS validation.” | Keep collection off now; implement bounded safe fetching before deployment |
| Content-Length guard is incomplete | “Can undeclared large bodies bypass limits?” | “The current guard checks declared size; it is not a full streamed-body cap.” | Keep local now; enforce real byte count before public exposure |
| TLS and forwarded-IP trust | “Have cloud transport and rate limits been secured?” | “DB certificate verification is disabled in one code path; forwarded headers need a trusted proxy.” | Report now; fix and test before deployment |
| Dockerfiles are not deployment evidence | “Where is it hosted?” | “This audit demonstrates a local build/server. Container definitions exist, but no cloud deployment is asserted.” | Exclusion files added; controlled container/CI/cloud test later |
| Health success need not mean model ready | “What if the model download fails?” | “Fallback is reported, but a 200 health response alone does not establish RoBERTa readiness.” | Use engine metadata; fix engine-aware readiness later |
| Model revision/deps not fully pinned | “Can another laptop reproduce exact outputs?” | “Sample is fixed; model commit and environment capture still need strengthening.” | Export environment later; avoid reproducibility guarantee |
| PDF click not full-system export proof | “Did the server generate that PDF?” | “Browser print creates it. The API export records metadata and is separately unverified end to end.” | Local synthetic print proof now; integrated test later |
| Limited project tests/CI | “Is everything automatically tested?” | “No. There are script-based checks and a new isolated browser regression; CI is not configured.” | Report executed checks now; dependency/test-command/CI cleanup later |
| No cloud, business or societal outcome proof | “What impact did this have?” | “We have implementation and component evaluation evidence, not measured adoption or impact.” | Use implementation metrics on resume; collect outcome evidence later |

## Priority interpretation

Before the panel, correctness of labels, claim boundaries, report identity, recovery, and the rehearsed local flow matter most. Before public hosting, the high-risk URL, inference, body-size, TLS, authorization, container, and secret-handling items become blockers. A successful college demo does not close those deployment issues.
