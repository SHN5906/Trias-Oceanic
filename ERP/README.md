# Trias Oceanic — ERPNext Implementation

Working repository for the ERPNext rollout at **Trias Oceanic**, a B2B distributor of fire suppression, drilling and safety equipment and critical spare parts for the mining and exploration industries in Papua New Guinea.

- Hosting: **Frappe Cloud** (managed), ERPNext v15
- Scope: **native configuration only** — no custom Frappe app, no client portal
- Engagement: setup + monthly maintenance (healthcheck, backups review, support)

## Project phases

| Phase | What | Where |
|---|---|---|
| 0 | Preparation — this repo (docs, templates, scripts) | you are here |
| 1 | Frappe Cloud site + ERPNext setup wizard | `docs/setup-checklist.md` |
| 2 | Master data: currencies, warehouses, item groups, UOMs | `scripts/setup_masters.py` |
| 3 | Data import: items, suppliers, customers, opening stock | `data-import/` + `scripts/import_items.py` |
| 4 | Users, roles, custom fields, quotation approval workflow | `scripts/create_users.py` + `customizations/` |
| 5 | Training (1h sessions per role) | `docs/training-plan.md` |
| 6 | Progressive go-live: sales → stock → accounting | `docs/go-live-plan.md` |
| 7 | Maintenance: healthcheck on a cron, monthly review | `scripts/healthcheck.py` |

## Business parameters

- Company: **Trias Oceanic**, Papua New Guinea — base currency **PGK**, secondary USD / AUD / EUR
- Warehouses: `Port Moresby - Main`, `In Transit (Import)` (transit type), `Supplier Stock`
- Item groups: Fire Suppression, Drilling Equipment, Safety Equipment, Critical Spare Parts
- Sales flow: Quotation → Sales Order → Delivery Note → Sales Invoice
- Purchase flow: Material Request → Purchase Order → Purchase Receipt (+ Landed Cost Voucher for freight/customs)
- Serial/batch tracking + reorder levels on critical spare parts
- Quotation approval workflow above 50,000 PGK (`customizations/workflows.md`)
- Roles: Sales User (sales reps), Stock User (storeman), Accounts Manager (accounting), System Manager (implementer)
- UI language: English

## Getting started

Requirements: Python 3.11+, `requests`.

```bash
pip install requests
cp scripts/config.example.env scripts/.env   # then fill in URL + API key/secret
```

Generate the API keys in ERPNext: **User list → your System Manager user → Settings tab → API Access → Generate Keys**. `scripts/.env` is gitignored — never commit real credentials.

## Script commands

All scripts that write to the site are **dry-run by default**: they validate and print what they would do, and send nothing until you pass `--execute`.

```bash
# 1. Check the site responds (also the maintenance cron job — exit 0/1)
python scripts/healthcheck.py

# 2. Create master data (currencies, warehouses, item groups, UOMs, groups, territory)
python scripts/setup_masters.py             # dry run — reads the site, writes nothing
python scripts/setup_masters.py --execute

# 3. Import items from CSV (dry run is fully offline — works before the site exists)
python scripts/import_items.py data-import/items-template.csv
python scripts/import_items.py data-import/items-template.csv --execute

# 4. Create users and assign roles (edit the USERS list in the script first)
python scripts/create_users.py
python scripts/create_users.py --execute
```

All scripts accept `--env path/to/.env` to point at a different credentials file. Scripts are idempotent: existing records are skipped or updated, never duplicated.

## Data import notes

- `items-template.csv` is consumed by `scripts/import_items.py` (validation + dry run built in).
- `suppliers-template.csv` and `customers-template.csv` are formatted for the native **Data Import** tool (Settings → Data Import → Supplier / Customer, file type CSV). Column headers are exact ERPNext fieldnames.
- `opening-stock-template.csv` feeds a **Stock Reconciliation** (Purpose: *Opening Stock*, difference account: *Temporary Opening*) — see the header note in the file. Import opening stock only after items and warehouses exist.

## Repo map

```
├── README.md
├── docs/
│   ├── setup-checklist.md      # Frappe Cloud + wizard + config, in execution order
│   ├── roles-permissions.md    # role × doctype permission matrix
│   ├── training-plan.md        # 1h sessions per role
│   └── go-live-plan.md         # 3-wave cutover with validation gates + rollback
├── data-import/                # CSV templates, exact ERPNext v15 fieldnames
├── scripts/                    # REST API client + setup/import/user/healthcheck scripts
└── customizations/             # custom fields, approval workflow, print format notes
```
