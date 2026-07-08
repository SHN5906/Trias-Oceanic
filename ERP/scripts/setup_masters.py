"""Create Trias Oceanic master data via the ERPNext API.

Covers: currencies (enable PGK/USD/AUD/EUR), warehouses, item groups, UOMs,
supplier groups, customer groups and the Papua New Guinea territory.

Dry-run by default: reads the site and prints what would change, writes
nothing. Requires scripts/.env even for dry runs (it reads server state).

Usage:
    python scripts/setup_masters.py             # dry run
    python scripts/setup_masters.py --execute
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))
from api_client import ERPNextClient, ERPNextError

CURRENCIES = ("PGK", "USD", "AUD", "EUR")
WAREHOUSES: tuple[dict[str, str], ...] = (
    {"warehouse_name": "Port Moresby - Main"},
    {"warehouse_name": "In Transit (Import)", "warehouse_type": "Transit"},
    {"warehouse_name": "Supplier Stock"},
)
ITEM_GROUPS = (
    "Fire Suppression",
    "Drilling Equipment",
    "Safety Equipment",
    "Critical Spare Parts",
)
UOMS = ("Nos", "Box", "Set", "Pair", "Metre", "Litre", "Kg", "Roll", "Drum")
SUPPLIER_GROUPS = ("Overseas", "Local PNG")
CUSTOMER_GROUPS = ("Mining", "Exploration", "Government", "Commercial")
TERRITORIES = ("Papua New Guinea",)


def op(kind: str, doctype: str, label: str, payload: dict[str, Any] | None = None,
       name: str | None = None) -> dict[str, Any]:
    return {"kind": kind, "doctype": doctype, "label": label,
            "payload": payload, "name": name}


def get_company(client: ERPNextClient) -> dict[str, Any]:
    companies = client.get_list(
        "Company", fields=["name", "abbr", "default_currency"]
    )
    if not companies:
        sys.exit("No Company found — run the ERPNext setup wizard first.")
    if len(companies) > 1:
        print(f"! {len(companies)} companies found, using: {companies[0]['name']}")
    return companies[0]


def collect_ops(client: ERPNextClient, company: dict[str, Any]) -> list[dict[str, Any]]:
    ops: list[dict[str, Any]] = []

    for code in CURRENCIES:
        try:
            currency = client.get_doc("Currency", code)
        except ERPNextError as exc:
            if exc.status_code != 404:
                raise
            ops.append(op("insert", "Currency", code,
                          {"doctype": "Currency", "currency_name": code, "enabled": 1}))
            continue
        if currency.get("enabled"):
            ops.append(op("skip", "Currency", f"{code} (already enabled)"))
        else:
            ops.append(op("update", "Currency", f"{code} (enable)",
                          {"enabled": 1}, name=code))

    for spec in WAREHOUSES:
        existing = client.get_list(
            "Warehouse",
            filters={"warehouse_name": spec["warehouse_name"],
                     "company": company["name"]},
            fields=["name"],
        )
        if existing:
            ops.append(op("skip", "Warehouse", f"{existing[0]['name']} (exists)"))
        else:
            payload = {"doctype": "Warehouse", "company": company["name"], **spec}
            ops.append(op("insert", "Warehouse",
                          f"{spec['warehouse_name']} - {company['abbr']}", payload))

    tree_specs = (
        ("Item Group", ITEM_GROUPS, "item_group_name", "parent_item_group",
         "All Item Groups"),
        ("Supplier Group", SUPPLIER_GROUPS, "supplier_group_name",
         "parent_supplier_group", "All Supplier Groups"),
        ("Customer Group", CUSTOMER_GROUPS, "customer_group_name",
         "parent_customer_group", "All Customer Groups"),
        ("Territory", TERRITORIES, "territory_name", "parent_territory",
         "All Territories"),
    )
    for doctype, names, name_field, parent_field, parent in tree_specs:
        for name in names:
            if client.exists(doctype, name):
                ops.append(op("skip", doctype, f"{name} (exists)"))
            else:
                ops.append(op("insert", doctype, name,
                              {"doctype": doctype, name_field: name,
                               parent_field: parent, "is_group": 0}))

    for uom in UOMS:
        if client.exists("UOM", uom):
            ops.append(op("skip", "UOM", f"{uom} (exists)"))
        else:
            ops.append(op("insert", "UOM", uom,
                          {"doctype": "UOM", "uom_name": uom}))

    return ops


def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("--execute", action="store_true",
                        help="apply the changes (default: dry run)")
    parser.add_argument("--env", help="path to .env file")
    args = parser.parse_args()

    client = ERPNextClient.from_env(args.env)
    company = get_company(client)
    print(f"Company: {company['name']} ({company['abbr']}), "
          f"currency {company['default_currency']}\n")

    ops = collect_ops(client, company)
    pending = [o for o in ops if o["kind"] != "skip"]
    for o in ops:
        marker = "-" if o["kind"] == "skip" else "+"
        print(f"{marker} {o['kind']:6} {o['doctype']}: {o['label']}")

    if not args.execute:
        print(f"\nDry run — {len(pending)} change(s) pending. "
              "Re-run with --execute to apply.")
        return

    failed = 0
    for o in pending:
        try:
            if o["kind"] == "insert":
                client.insert_doc(o["doctype"], o["payload"])
            else:
                client.update_doc(o["doctype"], o["name"], o["payload"])
        except ERPNextError as exc:
            print(f"✗ {o['doctype']} {o['label']}: {exc}", file=sys.stderr)
            failed += 1
        else:
            print(f"✓ {o['kind']}ed {o['doctype']}: {o['label']}")
    print(f"\nDone: {len(pending) - failed} applied, {failed} failed.")
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
