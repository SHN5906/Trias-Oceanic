# Go-Live Plan — Progressive Cutover

Three waves. Each wave has entry criteria (gate to start), a parallel-run rule, validation criteria (gate to declare it live), and a rollback path. Never start a wave while the previous one is failing its validation.

## Overview

| Wave | Weeks | Scope | Users |
|---|---|---|---|
| 1 — Sales | 1–2 | Customers, Quotations, Sales Orders | Sales reps, GM |
| 2 — Stock | 3–4 | Items live, opening stock, Delivery Notes, purchases | Storeman (+ wave 1) |
| 3 — Accounting | 5+ | Sales/Purchase Invoices, payments, landed costs | Accountant (all live) |

During waves 1–2, invoicing continues in the current system; ERPNext invoicing starts only at wave 3 with opening balances.

## Wave 1 — Sales (weeks 1–2)

**Entry criteria**
- Setup checklist complete through step 12 (end-to-end validation passed)
- S1, S2, S7 training done; approval workflow tested by the GM personally
- Customers imported and spot-checked

**Rules during the wave**
- 100% of new quotations and sales orders created in ERPNext
- Deliveries and invoices still processed the old way (Sales Orders marked delivered/closed manually for now)
- Daily 15-min check-in with sales reps for the first 5 working days

**Validation criteria (end of week 2)**
- ≥ 95% of quotations issued via ERPNext (count vs. old system/email)
- At least one > 50,000 PGK quotation went through approval correctly
- Zero quotations blocked > 4h waiting on a system issue
- Sales reps rate the flow workable (direct ask, not a survey)

**Rollback**: revert to the old quoting method (templates kept untouched); ERPNext quotes already issued remain valid documents. Nothing accounting-critical is in ERPNext yet, so rollback cost is near zero.

## Wave 2 — Stock (weeks 3–4)

**Entry criteria**
- Wave 1 validated
- Items imported (real catalogue), S3/S4 training done
- **Stock count frozen and imported** via Stock Reconciliation dated the cutover morning — the count is the client's responsibility, the import is ours

**Rules during the wave**
- All goods movements (receipts, deliveries, transfers) recorded in ERPNext same-day
- Delivery Notes now generated from the wave-1 Sales Orders
- Purchases: Material Request → PO → Purchase Receipt in ERPNext (payment still old system)
- Weekly cycle count of 10 random items

**Validation criteria (end of week 4)**
- Cycle counts ≥ 98% accurate (qty match ERPNext vs. shelf)
- All serial/batch-tracked spares traceable (pick 3, trace them fully)
- At least one auto Material Request generated from a reorder level and actioned
- No negative-stock errors blocking a delivery

**Rollback**: stock module paused, movements return to the manual register; ERPNext stock marked "unreliable until re-count". Sales (wave 1) continues unaffected. Re-entry requires a fresh stock count.

## Wave 3 — Accounting (week 5+)

**Entry criteria**
- Waves 1–2 validated
- S5/S6 training done
- Opening balances agreed with the accountant: AR/AP per party, bank balances, stock value (already in from wave 2) — entered via Opening Invoice Creation Tool + Journal Entry, cut-off date agreed
- Exchange rate policy decided (auto provider vs. manual monthly rates)

**Rules during the wave**
- All new Sales Invoices from ERPNext Delivery Notes; all supplier invoices as Purchase Invoices with Landed Cost Vouchers on imports
- Old system kept read-only for history; **first month runs parallel**: trial balance compared at month-end
- No document deletion — cancel/amend only, so the audit trail stays intact

**Validation criteria (end of first full month)**
- Month-end trial balance reconciles with the parallel run (differences explained line by line)
- AR ageing matches reality (accountant sign-off)
- Landed costs applied on 100% of import receipts that month
- Accountant closes the month in ERPNext without assistance

**Rollback**: hardest wave to roll back — this is why it runs parallel. If validation fails, ERPNext accounting is declared non-authoritative for that month, the old system remains the book of record, issues are fixed, and the next month re-runs the parallel. Sales and stock stay live regardless.

## Cross-wave safety

- Frappe Cloud daily backups verified weekly during the whole cutover; manual backup downloaded before each wave starts
- One named escalation contact (me) with a response-time commitment during waves
- Every configuration change during go-live is logged in this repo (commit per change)
- Go/no-go decision for each wave is explicit — a dated note added at the bottom of this file

## Decision log

| Date | Decision | By |
|---|---|---|
| — | — | — |
