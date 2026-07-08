# Training Plan

Principles: **max 1h per session**, hands-on on the real (or staging) site, English, one role at a time, each session ends with the trainee doing the full exercise alone. Record sessions (screen capture) so they double as reference material. Schedule each role's training in the week before their go-live wave (see `docs/go-live-plan.md`).

## Session overview

| # | Audience | Topic | When |
|---|---|---|---|
| S1 | Sales reps + GM | Navigation, customers, quotations | Before wave 1 |
| S2 | Sales reps + GM | Sales orders, approval workflow, sales reports | Before wave 1 |
| S3 | Storeman | Items, warehouses, stock levels | Before wave 2 |
| S4 | Storeman | Deliveries, receipts, serial/batch, reorder | Before wave 2 |
| S5 | Accountant | Invoicing, payments, multi-currency | Before wave 3 |
| S6 | Accountant | Landed costs, reports, month-end | Before wave 3 |
| S7 | GM / owner | Dashboards, approvals, oversight | During wave 1 |

## S1 — Sales basics (Sales User)

- 0–10 min: login, desk navigation, awesome bar search, list vs. form views
- 10–25 min: customers — find, create, contact/address
- 25–45 min: quotations — create, add items, discounts, PDF, email to customer
- 45–60 min: **exercise** — trainee creates a customer and a 3-line quotation, emails the PDF, unaided
- Success: exercise completed without help; quotation looks right on the print format

## S2 — Sales orders & approvals (Sales User + Sales Manager)

- 0–15 min: quotation → Sales Order conversion, delivery date, order status lifecycle
- 15–30 min: approval workflow — what happens above 50,000 PGK, how the GM approves/rejects (GM present for this part)
- 30–45 min: amend/cancel, common errors (stock UOM, missing price)
- 45–60 min: **exercise** — quote above 50k PGK through approval to Sales Order
- Success: both rep and GM complete their side of the workflow unaided

## S3 — Stock basics (Stock User)

- 0–15 min: item master — reading it, item groups, what the custom OEM/compatibility fields mean
- 15–30 min: warehouses, stock balance report, stock ledger
- 30–45 min: creating/editing items, when serial vs. batch applies
- 45–60 min: **exercise** — create a serialized item, check its stock in two reports
- Success: trainee can answer "how many X do we have and where" in under a minute

## S4 — Stock movements (Stock User)

- 0–15 min: Delivery Note from Sales Order, picking serial/batch numbers
- 15–35 min: purchase side — Material Request, Purchase Receipt into `In Transit (Import)`, transfer to main warehouse
- 35–45 min: reorder levels — how auto Material Requests appear, what to do with them
- 45–60 min: **exercise** — receive a PO with a batch item, transfer it, deliver it against an SO
- Success: full in-and-out cycle done unaided with correct serial/batch selection

## S5 — Accounts basics (Accounts Manager)

- 0–15 min: Sales Invoice from Delivery Note, payment terms
- 15–30 min: Payment Entry, matching payments to invoices, accounts receivable report
- 30–45 min: multi-currency — USD/AUD/EUR supplier invoices, exchange rates, where gains/losses land
- 45–60 min: **exercise** — invoice a delivery, record a partial payment, read the AR ageing
- Success: AR report interpreted correctly, partial payment allocated correctly

## S6 — Landed costs & close (Accounts Manager)

- 0–20 min: Landed Cost Voucher — freight + customs onto a Purchase Receipt, effect on valuation
- 20–35 min: key reports — P&L, balance sheet, stock valuation, gross profit per item group
- 35–45 min: month-end routine checklist (unreconciled payments, draft documents, exchange revaluation)
- 45–60 min: **exercise** — apply a landed cost voucher and show the item's new valuation rate
- Success: trainee explains why the item cost went up and by how much

## S7 — Management view (GM / owner, 45 min)

- Dashboards and shortcuts for orders, stock, receivables
- Approving quotations from email/mobile
- What to escalate to support (and what the monthly maintenance covers)

## Materials

- Recordings of each session (shared folder)
- One-page cheat sheet per role (produce after each session, from real questions asked)
- ERPNext official docs: https://docs.erpnext.com — bookmark the relevant user manual sections per role
