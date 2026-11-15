# Tegemea — Implementation Audit Matrix v1

**Status legend:** Not inspected / Implemented / Partial / Missing / Contradictory / Not yet in scope. **All implementation statuses are currently Not inspected**; screenshots of live behaviour are observations, not a code audit.

| ID | Requirement | Evidence to locate in repository | Acceptance test | Status |
|---|---|---|---|---|
| R01 | Opening statement captured and retained | Homepage handoff, API payload, state store | A02 | Not inspected |
| R02 | Confirmed facts persist across turns | Fact extraction and canonical state | A02, A08 | Not inspected |
| R03 | Corrections supersede prior facts | Reconciliation logic | A08 | Not inspected |
| R04 | Responsibilities precede hour interrogation | System prompt and question selection | A01 | Not inspected |
| R05 | No repeated/not-applicable questions | Topic-state rules | A04 | Not inspected |
| R06 | Proportionate adaptive questioning | Materiality/completion logic | A05, A12 | Not inspected |
| R07 | Requested vs assessed hours separated | Typed schema and calculation layer | A06 | Not inspected |
| R08 | Daily vs weekly units accurate | Parser and arithmetic | A03 | Not inspected |
| R09 | Active hours vs availability separate | Coverage schema and rules | A09 | Not inspected |
| R10 | Inbox/scheduling/minutes benchmarks | Workload rules and tests | A06, A07 | Not inspected |
| R11 | Peak and seasonal work assessed | Structured facts and prompts | A04 | Not inspected |
| R12 | Role choice is evidence-led | Role decision rules | A01, A06 | Not inspected |
| R13 | Outsourced vs employment comparison | Delivery-model rules | A10 | Not inspected |
| R14 | Holiday cover accurately described | Policy copy and rules | A11 | Not inspected |
| R15 | Pricing uses approved schedule only | Config and deterministic calculations | A16 | Not inspected |
| R16 | Safe OpenAI server integration | Netlify Function, env handling | A15 | Not inspected |
| R17 | State survives refresh appropriately | Persistence and privacy controls | A14 | Not inspected |
| R18 | Completion doesn't require all fields | Completion logic | A12 | Not inspected |
| R19 | Free recommendation grounded in evidence | Structured recommendation renderer | Manual + future tests | Not inspected |
| R20 | PDF/email with consent, later phase | Report/email design | Future phase | Not inspected |

## Required Cursor audit output

For each row, record: **status, exact file path and relevant function, observed behaviour, gap, severity (critical/high/medium/low), recommended minimal change, and test coverage**. Cite code, not guesses. Mark features deliberately scheduled for later phases separately from defects. Flag mismatches between this specification and current code. Do not change files, dependencies, secrets, deployments or pricing during the audit.
