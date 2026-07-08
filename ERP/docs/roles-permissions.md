# Roles & Permissions Matrix

ERPNext standard roles cover most needs; this documents the target state and the deviations to configure via **Role Permission Manager**. Verify against this matrix by logging in as each user (setup checklist step 11).

## People → roles

| Person | ERPNext roles | Notes |
|---|---|---|
| Sales reps | Sales User | Create quotes/orders; cannot see purchasing or accounting |
| GM / owner | Sales User, Sales Manager | Approves quotations > 50,000 PGK (workflow) |
| Storeman | Stock User | Warehouse operations; read-only on sales docs |
| Accountant | Accounts User, Accounts Manager | Invoicing, payments, landed costs, period close |
| Implementer (Renew Editing) | System Manager | Full admin |

## Permission matrix

Legend: **R** read · **W** write · **C** create · **S** submit · **–** no access. System Manager has full access everywhere (not repeated).

| DocType | Sales User | Sales Manager | Stock User | Accounts Mgr |
|---|---|---|---|---|
| Customer | R W C | R W C | R | R W |
| Quotation | R W C S* | R W C S | – | R |
| Sales Order | R W C S | R W C S | R | R |
| Delivery Note | R | R | R W C S | R |
| Sales Invoice | R | R | R | R W C S |
| Payment Entry | – | – | – | R W C S |
| Item | R | R | R W C | R |
| Warehouse | R | R | R | R |
| Stock Entry | – | – | R W C S | R |
| Stock Reconciliation | – | – | R W C S | R |
| Material Request | R W C | R W C S | R W C S | R |
| Supplier | – | R | R | R W C |
| Purchase Order | – | R | R W C | R W C S |
| Purchase Receipt | – | – | R W C S | R |
| Purchase Invoice | – | – | R | R W C S |
| Landed Cost Voucher | – | – | R | R W C S |
| Serial No / Batch | R | R | R W C | R |

\* Sales User can submit quotations only up to 50,000 PGK — above that the approval workflow routes to Sales Manager (see `customizations/workflows.md`).

## Deviations from ERPNext defaults to configure

1. **Sales User**: remove default write access to Item (read only) — sales reps request item changes via the storeman.
2. **Stock User**: confirm read access to Sales Order (needed to prepare deliveries); no access to rates on purchase documents is *not* enforceable field-level without heavier customization — accepted for now.
3. **Accounts Manager**: gets create/submit on Purchase Order (final commercial commitment sits with accounting per client's process).
4. Nobody except System Manager gets **Role Permission Manager**, **Customize Form**, or user management.

## How to apply

Settings → **Role Permission Manager** → select DocType → adjust per role. Test with a real login, not just the matrix screen. Record any change made post-go-live in this file (this repo is the source of truth).
