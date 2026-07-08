# Setup Checklist — Frappe Cloud + ERPNext

Steps in real execution order. Check each box as you go. Estimated total: 2–3 working days spread over week 1.

## 0. Before touching Frappe Cloud

- [ ] Collect from client: company legal name, TIN (PNG tax ID), logo (use vitrine site assets), bank details (PGK + USD accounts), letterhead wording
- [ ] Collect master data: item list, supplier list, customer list, current stock count (fill the `data-import/` templates)
- [ ] Confirm fiscal year with the accountant (PNG standard: 1 Jan – 31 Dec)
- [ ] Decide quotation approver (GM/owner — gets the Sales Manager role)

## 1. Frappe Cloud

- [ ] Create Frappe Cloud account (client email as owner, add yourself as team member — client owns the subscription)
- [ ] Choose plan (shared bench is enough at this size; can upgrade later)
- [ ] Create site: app **ERPNext** (latest stable, v15), region closest to PNG offered (Singapore/Mumbai), site name `trias-oceanic.frappe.cloud`
- [ ] Verify automatic daily backups are enabled (Site → Backups)
- [ ] Note the site URL in `scripts/.env`

## 2. ERPNext setup wizard

- [ ] Language: **English**
- [ ] Country: **Papua New Guinea** (sets currency PGK + timezone Pacific/Port_Moresby)
- [ ] Company name: **Trias Oceanic** — abbreviation **TO**
- [ ] Chart of accounts: **Standard**
- [ ] Fiscal year: as confirmed in step 0
- [ ] Complete wizard, land on the ERPNext desk

## 3. Base system settings

- [ ] System Settings: date format `dd-mm-yyyy`, first day of week Monday, currency precision 2, session expiry per client preference
- [ ] Website Settings: disable public signup
- [ ] Company doc: upload logo, fill tax ID, default letterhead (created in step 10)

## 4. API access + first healthcheck

- [ ] Your System Manager user → Settings tab → API Access → **Generate Keys**
- [ ] `cp scripts/config.example.env scripts/.env`, fill URL + key + secret
- [ ] `python scripts/healthcheck.py` → all three checks green

## 5. Master data (scripted)

- [ ] `python scripts/setup_masters.py` — review the dry-run output
- [ ] `python scripts/setup_masters.py --execute`
- [ ] Verify in the UI: 4 currencies enabled, 3 warehouses under Trias Oceanic, 4 item groups, supplier/customer groups, Papua New Guinea territory, UOMs

## 6. Stock settings

- [ ] Stock Settings: default valuation method **FIFO**, **Allow Negative Stock OFF**, default warehouse `Port Moresby - Main - TO`
- [ ] Enable **Raise Material Request when stock reaches re-order level** (drives auto-reorder on critical spares)
- [ ] Serial/batch naming series acceptable defaults (adjust only if client has a convention)

## 7. Selling & buying settings

- [ ] Selling Settings: default price list **Standard Selling** (PGK), quotation validity 30 days, Sales Order required for invoice **Yes**, Delivery Note required for invoice **Yes**
- [ ] Buying Settings: Purchase Order required **Yes**, Purchase Receipt required **Yes**, maintain same rate check per client tolerance
- [ ] Accounts Settings: enable multi-currency invoicing, default payment terms (e.g. Net 30), exchange rate provider defaults (frankfurter/exchangerate.host built-in) — accountant may prefer manual rates for PGK

## 8. Customizations

- [ ] Create custom fields on Item (`customizations/custom-fields.md`)
- [ ] Create the quotation approval workflow (`customizations/workflows.md`)
- [ ] Test both with a dummy item + dummy quotation above and below 50,000 PGK

## 9. Data import

- [ ] `python scripts/import_items.py data-import/items-template.csv` → review → `--execute` (with the real filled CSV)
- [ ] Suppliers: Settings → Data Import → Supplier → upload `suppliers-template.csv` (filled)
- [ ] Customers: Data Import → Customer → upload `customers-template.csv` (filled)
- [ ] Opening stock: Stock Reconciliation, Purpose **Opening Stock**, difference account **Temporary Opening - TO**, rows from `opening-stock-template.csv` — only after items + warehouses exist. Serial numbers: one per line in the UI (the CSV uses `;` between them)
- [ ] Spot-check 5 items, 3 suppliers, 3 customers, total stock value vs. the client's count

## 10. Print & email

- [ ] Letter Head with Trias logo (see `customizations/print-formats/quotation.md`)
- [ ] Quotation print format built and set as default
- [ ] Outgoing email account configured (Frappe Cloud default mail or client SMTP), test by emailing a quotation PDF to yourself

## 11. Users & roles

- [ ] Edit `USERS` in `scripts/create_users.py` with real emails
- [ ] `python scripts/create_users.py --execute`
- [ ] Log in as each user (or impersonate) and verify the permission matrix (`docs/roles-permissions.md`) — sales rep cannot see Purchase Orders, storeman cannot create invoices, etc.

## 12. End-to-end validation (gate before training)

- [ ] Full sales cycle on test data: Quotation (>50k PGK, approve it) → Sales Order → Delivery Note (serial-tracked item) → Sales Invoice → Payment Entry
- [ ] Full purchase cycle: Material Request (auto-generated from reorder if possible) → Purchase Order (USD supplier) → Purchase Receipt into `In Transit (Import)` → transfer to `Port Moresby - Main` → Landed Cost Voucher (freight + customs) → verify item valuation increased
- [ ] Cancel/amend one document of each type to know the recovery path
- [ ] Delete or clearly mark all test data before go-live

## 13. Safety net

- [ ] Download one full backup manually and store it off Frappe Cloud
- [ ] Note the restore procedure (Frappe Cloud → Site → Backups → Restore) in your runbook
