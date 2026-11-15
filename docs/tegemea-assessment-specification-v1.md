# Tegemea Operational Support Assessment — Master Specification v1.0

**Status:** Baseline for validation against the existing codebase; not evidence of implementation.  
**Purpose:** A consultative, industry-agnostic assessment of business support needs. It must independently assess work, workload, coverage and staffing options rather than merely quote the hours or role a visitor requests.

## 1. Product principles

- Conversational, one meaningful question at a time; adaptive, proportionate and generally around 10–15 minutes, with depth varying by complexity.
- The visitor can answer in their own words, volunteer multiple facts, correct answers, skip nonessential details and ask clarification questions without resetting progress.
- Explore actual responsibilities and operational pain points **before prioritising scheduling or pricing**, unless the visitor's own description makes a coverage constraint critical.
- The visitor's named role and estimated hours are **hypotheses**, not validated conclusions. The assessment may recommend EA, Project Support, Operations Coordinator, a blended role, process improvement or another arrangement.
- Do not manufacture facts, false precision, pricing, salaries, availability or promised staffing capacity. Distinguish visitor statements, calculated values, provisional estimates and unknowns.
- The free on-screen recommendation should be useful without email capture. A more detailed branded PDF may be offered with appropriate email and separate marketing consent; PDF and email are later phases.
- Recommendations should be advisory and not automatically favour Tegemea's outsourced offering.

## 2. Conversation decision policy

1. Extract facts from the homepage opening statement and every subsequent message.
2. Record each fact with source text, units, status (confirmed / inferred / provisional / unknown / not applicable / superseded), and any relevant correction.
3. Identify the most material uncertainty for determining work, role, hours or delivery model.
4. Ask only if resolving that uncertainty is likely to change the recommendation or feasibility; otherwise record an assumption to validate later.
5. Do not re-ask an answered question, pursue a topic marked not applicable without new evidence, or force completion of optional fields.
6. Explore relevant work volumes and complexity: inbox, diary, meetings and minutes, projects, coordination, recurring processes, peaks and invisible labour.
7. Compare the visitor's estimate against assessed workload. Where they differ, explain why and show uncertainty.
8. Distinguish active task hours from availability windows, response-time expectations and dedicated cover.
9. Conclude when evidence is sufficient; optionally ask a final missed-delegation question if genuinely useful.
10. Respond naturally: avoid repetitive 'Thank you', lengthy recaps, scripted topic order and overly specific onboarding questions.

## 3. Structured facts and state

Store at minimum: business sector and scale; support objectives; tasks and frequencies; task volumes; complexity and stakeholders; named/requested role; requested hours with unit and days; assessed baseline hours/range; peak workload and timing; coverage windows and response expectations; work location; outsourcing/employment preference; constraints; process-improvement opportunities; confidence/assumptions; topic statuses; conversation history and corrections. Maintain explicit provenance. **Requested, assessed and finally agreed hours must remain separate fields.** A page refresh should not silently lose confirmed information, subject to the privacy/storage design.

## 4. Workload evidence and benchmarks

These are starting assumptions to validate against task specifics, not universal multipliers.

| Work area | Baseline / assessment approach | Material follow-ups |
|---|---|---|
| Inbox | For 80–150 messages/day, ~40% actionable, a provisional 60–90 minutes/day may be a starting estimate, depending on delegation and complexity | Volume, actionable share, triage vs responses, authority, urgency |
| Internal scheduling | 12 internal bookings with shared-calendar visibility and authority might take 15–20 minutes total in a simple batch | Access, authority, rescheduling, participants |
| External scheduling | Simple external 1:1 can take 5–10 minutes active; complex coordination across four senior executives from separate organisations without calendar access may take 20–30 minutes; 12 external bookings without visibility can take up to ~60 minutes | External stakeholders, polls, calendar access, coordination complexity |
| Minutes | Meeting attendance + ~1.5× meeting duration for manual drafting; a one-hour meeting with minutes may require ~2.5 hours total | Minutes standard, AI tools, turnaround, approvals |
| Projects / coordination | Estimate from real recurring activities, project count, stakeholders, chasing, reporting, meetings and peaks; **no blanket multiplier** | Number, complexity, cadence, external dependencies |
| Operational tasks | Capture onboarding, calls, research, file organisation, follow-up, document handling and other 'invisible' work | Volume, cadence, handoffs, seasonality |

When volumes are unavailable, make a transparent provisional range and state what would refine it. Consider automation opportunities and time savings conservatively; do not subtract speculative savings as guaranteed.

## 5. Coverage and delivery

- Distinguish **active hours** (work performed), **availability** (when reachable), **response time** and **dedicated coverage**.
- Example: 2 hours/day × 5 days = 10 active hours/week. Morning and late-afternoon check-ins suggest split-day coverage; exact times can normally be agreed later.
- Do not imply that 10 active hours buys 40 hours of dedicated availability.
- Full-day dedicated coverage, highly time-sensitive work or substantial weekly hours may make employment or bespoke staffing more appropriate.
- 25+ hours/week prompts consideration of direct employment but does not mandate it. A 20-hour role may suit employment; a flexible 30-hour role may suit outsourcing depending on context.
- **Tegemea provides holiday cover for outsourced support**, ordinarily for essential activities, not guaranteed like-for-like staffing hours. Equivalent coverage requires capacity and explicit agreement. Avoid promising full-day cover or identical hours.
- Assess continuity, management burden, flexibility, client preference, employment on-costs and potential recruitment costs where material.

## 6. Outsourced commercial rules — provisional product configuration

Pricing is **per week, excluding VAT**, booked in five-hour weekly increments, with no rollover; additional hours require agreement and availability. Present prices only where a viable outsourced arrangement is appropriate. Recent discussions considered revising tiers; **the exact current public price schedule must be explicitly confirmed before coding**.

| Weekly hours | Earlier agreed schedule | Later discussed alternative — NOT approved as final |
|---|---|---|
| 5 | £35/hour = £175/week | To confirm |
| 10 | £33.50/hour = £335/week | £33.50/hour discussed for 10–15 hours |
| 15 | £30/hour = £450/week | £33.50/hour discussed for 10–15 hours |
| 20+ | £28/hour (20h = £560/week) | £28/hour discussed for 20+ hours |

40 hours at £28/hour has been used in a **hypothetical illustration**, not a guaranteed standard dedicated-cover offer. Avoid default four-week or five-week 'monthly' prices. Distinguish Tegemea charges from employee salaries, employer NI, pensions and recruitment fees. Recruitment fee percentages used in simulations are examples only, not Tegemea's confirmed tariff.

## 7. Recommendation logic and output

The recommendation engine (future phase) should generate a single versioned structured result that drives both on-screen and PDF views:

- Brief understanding of the business and key operational challenges.
- Delegable work by category; evidence, frequency and assumptions.
- Recommended role or blended role, with alternatives and reasons.
- **Requested vs assessed** weekly hours, baseline and peak, with confidence/range and a transparent task-based breakdown.
- Active-work vs coverage expectations and practical delivery model.
- Outsourced versus permanent / temp-to-perm comparison where relevant, including qualitative trade-offs.
- Relevant process improvements / potential automation, with uncertainty.
- Weekly outsourced price plus VAT **only if appropriate and current pricing approved**.
- Outstanding assumptions and next steps; invitation to discuss or validate, not mandatory sales conversion.

A free PDF can include a role-responsibilities summary, but not a complete ready-to-advertise job description. A paid JD builder/review is a separate future product, not part of the current release.

## 8. Technical and safety requirements

- Keep OpenAI API calls server-side in Netlify Functions; never expose API keys in browser bundles, source control or logs.
- Preserve relevant conversation context and canonical structured facts; reconcile corrections deterministically rather than relying only on the model's memory.
- Deterministic code for arithmetic, pricing and rule thresholds; AI for language interpretation, follow-up selection and narrative explanation.
- Schema-validate model outputs; fail safely on incomplete or invalid data; preserve visitor replies during recoverable errors.
- Apply request-size and rate limits; note that per-instance in-memory limits are **not** global spending ceilings. Configure API budgets/alerts and monitor use.
- Limit retention and sensitive data collection; publish appropriate privacy disclosures and consent choices before email/report storage.
- Distinguish automated/mock tests from real API evaluations; do not assert correctness based only on a successful build.

## 9. Acceptance scenarios

| ID | Scenario | Expected behaviour |
|---|---|---|
| A01 | 'I direct a growing accountancy firm and need an EA' | Ask what work needs delegating before focusing on hours or schedule |
| A02 | Opening statement '2 hours of remote support per day' | Capture daily unit and remote preference; do not ask again |
| A03 | User later says '5 days' | Derive 10 active hours/week; distinguish from coverage |
| A04 | 'No specific projects; peaks around group travel' | Mark ongoing projects not applicable; explore seasonal travel needs if material |
| A05 | 'Morning and late afternoon' | Record split-day preference; don't demand exact clock times unless essential |
| A06 | High-volume inbox, external diary, team chasing | Ask proportional questions about volume/authority/complexity; challenge requested hours if evidence supports it |
| A07 | Meeting minutes | Include attendance plus manual drafting allowance; distinguish AI-assisted process |
| A08 | User corrects 2 hours/week to 2 hours/day | Supersede prior fact; preserve correct unit in future turns |
| A09 | 10 active hours but 9–5 immediate availability | Flag material coverage mismatch; don't promise dedicated full-day service |
| A10 | 25–30 hours/week | Compare outsourcing and employment contextually, without automatic threshold outcome |
| A11 | Outsourced holiday cover question | Essential-task cover included; like-for-like cover not automatically guaranteed |
| A12 | Simple scenario with optional fields unknown | Finish without exhaustive questioning; label assumptions |
| A13 | User asks a side question about costs | Answer accurately without losing assessment state |
| A14 | User refreshes midway | Restore facts/conversation as designed and disclose storage limitations |
| A15 | OpenAI returns 429 or timeout | Friendly retry; no lost input; no exposed secrets |
| A16 | Visitor asks for pricing | Use only approved configured tiers; exclude VAT and do not invent recruitment fee |

## 10. Known decisions requiring confirmation

1. **Current price schedule**: 15-hour tier (£30/hour earlier vs £33.50/hour later discussion); 5-hour entry tier retention; public price display.
2. **Five-hour holiday cover**: whether any specific limitations apply, while preserving the principle of essential-task cover for outsourced clients.
3. **Persistence design**: browser-only, authenticated or server-side storage; retention and privacy wording.
4. **Model and budget**: actual configured OpenAI model, token/context strategy, cost limits and monitoring.
5. **Output phase boundaries**: current conversation-only phase vs recommendations/PDF and email collection.
6. **Final role taxonomy**: EA, Project Support, Operations Coordinator and possible operations assistant/business manager labels.

**Change control:** Every confirmed rule gets a stable requirement ID, an implementation reference and an automated or manual acceptance test. Changes to the spec require review before code changes.
