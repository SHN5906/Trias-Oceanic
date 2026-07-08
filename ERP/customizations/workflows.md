# Workflow — Quotation Approval above 50,000 PGK

Any quotation with a company-currency total above **50,000 PGK** must be approved by the Sales Manager (GM) before it can be submitted and sent to the customer. Smaller quotations submit directly.

> **Currency note**: conditions use `base_grand_total` (company currency, PGK), not `grand_total` (transaction currency) — a 15,000 USD quote must still route to approval.

## Workflow definition

Create via Settings → **Workflow** → New:

| Setting | Value |
|---|---|
| Workflow Name | Quotation Approval |
| Document Type | Quotation |
| Is Active | ✓ |
| Workflow State Field | `workflow_state` (default) |
| Don't Override Status | ✓ (keeps native status behaviour where possible) |

## States

| State | Doc Status | Only Allow Edit For |
|---|---|---|
| Draft | 0 (Draft) | Sales User |
| Pending Approval | 0 (Draft) | Sales Manager |
| Approved | 1 (Submitted) | Sales Manager |
| Rejected | 0 (Draft) | Sales User |

## Transitions

| From | Action | To | Allowed role | Condition |
|---|---|---|---|---|
| Draft | Submit | Approved | Sales User | `doc.base_grand_total <= 50000` |
| Draft | Request Approval | Pending Approval | Sales User | `doc.base_grand_total > 50000` |
| Pending Approval | Approve | Approved | Sales Manager | |
| Pending Approval | Reject | Rejected | Sales Manager | |
| Rejected | Request Approval | Pending Approval | Sales User | |

Leave **Allow Self Approval** unchecked on the Approve transition — the GM shouldn't approve a quote they created from a rep's account, and reps must not approve their own.

## Notifications

Add two Notification documents (Settings → Notification):

1. **To Sales Manager** — DocType Quotation, trigger *Value Change* on `workflow_state` = `Pending Approval`, channel Email: "Quotation {{ doc.name }} for {{ doc.customer_name }} ({{ doc.base_grand_total }} PGK) awaits your approval."
2. **To owner (rep)** — same trigger on `Approved` and on `Rejected`, so the rep knows to send or revise.

## Test cases (run before wave 1)

- [ ] Quotation at 49,999 PGK: Sales User submits directly, state Approved, docstatus Submitted
- [ ] Quotation at 50,001 PGK: Submit action absent for Sales User; Request Approval moves it to Pending Approval; rep can no longer edit
- [ ] Sales Manager approves → document submitted, rep notified
- [ ] Sales Manager rejects → back to editable Rejected state for the rep, who amends and re-requests
- [ ] USD quotation worth > 50,000 PGK at current rate routes to approval
- [ ] Sales Manager's own quotation > 50k cannot be self-approved
