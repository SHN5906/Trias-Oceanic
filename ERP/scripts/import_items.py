"""Import Items into ERPNext from a CSV file (data-import/items-template.csv).

Validates every row and prints a dry-run report by default — the dry run is
fully offline, so it works before the site even exists. Nothing is sent to
the server unless --execute is passed. Existing item_codes are skipped.

The custom_* columns require the custom fields described in
customizations/custom-fields.md to exist on the site first.

Usage:
    python scripts/import_items.py data-import/items-template.csv
    python scripts/import_items.py data-import/items-template.csv --execute
"""
from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))
from api_client import ERPNextClient, ERPNextError

REQUIRED_FIELDS = ("item_code", "item_name", "item_group", "stock_uom")
TEXT_FIELDS = (
    "item_code", "item_name", "item_group", "description", "stock_uom",
    "custom_oem_part_number", "custom_machine_compatibility",
)
BOOLEAN_FIELDS = ("is_stock_item", "has_serial_no", "has_batch_no")
FLOAT_FIELDS = ("valuation_rate", "standard_rate", "safety_stock")
INT_FIELDS = ("lead_time_days",)
EXPECTED_ITEM_GROUPS = {
    "Fire Suppression", "Drilling Equipment", "Safety Equipment",
    "Critical Spare Parts",
}


def read_rows(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        missing = [c for c in REQUIRED_FIELDS if c not in (reader.fieldnames or [])]
        if missing:
            sys.exit(f"CSV is missing required columns: {', '.join(missing)}")
        return [
            {key: (value or "").strip() for key, value in row.items() if key}
            for row in reader
        ]


def validate(rows: list[dict[str, str]]) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    seen: set[str] = set()
    for line, row in enumerate(rows, start=2):  # header is line 1
        where = f"line {line} ({row.get('item_code') or 'no item_code'})"
        for field in REQUIRED_FIELDS:
            if not row.get(field):
                errors.append(f"{where}: missing required field '{field}'")
        code = row.get("item_code", "")
        if code:
            if code in seen:
                errors.append(f"{where}: duplicate item_code")
            seen.add(code)
        for field in BOOLEAN_FIELDS:
            if row.get(field, "") not in ("", "0", "1"):
                errors.append(f"{where}: '{field}' must be 0 or 1")
        for field in (*FLOAT_FIELDS, "reorder_level", "reorder_qty"):
            value = row.get(field, "")
            if value:
                try:
                    float(value)
                except ValueError:
                    errors.append(f"{where}: '{field}' is not a number ({value!r})")
        for field in INT_FIELDS:
            value = row.get(field, "")
            if value and not value.isdigit():
                errors.append(f"{where}: '{field}' must be a whole number ({value!r})")
        if row.get("item_group") and row["item_group"] not in EXPECTED_ITEM_GROUPS:
            warnings.append(
                f"{where}: item_group '{row['item_group']}' is not one of the "
                "standard Trias groups"
            )
        if row.get("reorder_level") and not row.get("reorder_warehouse"):
            errors.append(f"{where}: reorder_level set but reorder_warehouse is empty")
        if row.get("has_serial_no") == "1" and row.get("has_batch_no") == "1":
            warnings.append(f"{where}: both serial and batch tracking enabled")
    return errors, warnings


def build_doc(row: dict[str, str], warehouse_map: dict[str, str]) -> dict[str, Any]:
    doc: dict[str, Any] = {"doctype": "Item"}
    for field in TEXT_FIELDS:
        if row.get(field):
            doc[field] = row[field]
    for field in BOOLEAN_FIELDS:
        if row.get(field):
            doc[field] = int(row[field])
    for field in FLOAT_FIELDS:
        if row.get(field):
            doc[field] = float(row[field])
    for field in INT_FIELDS:
        if row.get(field):
            doc[field] = int(row[field])
    if row.get("reorder_level"):
        # Item Reorder child-table fieldnames differ from the CSV column names.
        doc["reorder_levels"] = [
            {
                "warehouse": warehouse_map[row["reorder_warehouse"]],
                "material_request_type": "Purchase",
                "warehouse_reorder_level": float(row["reorder_level"]),
                "warehouse_reorder_qty": float(row.get("reorder_qty") or 0),
            }
        ]
    return doc


def resolve_warehouses(
    client: ERPNextClient, rows: list[dict[str, str]]
) -> dict[str, str]:
    """Map plain warehouse names from the CSV to actual docnames (with abbr)."""
    names = {row["reorder_warehouse"] for row in rows if row.get("reorder_warehouse")}
    mapping: dict[str, str] = {}
    for name in sorted(names):
        found = client.get_list(
            "Warehouse", filters={"warehouse_name": name}, fields=["name"]
        )
        if not found:
            sys.exit(f"Warehouse '{name}' not found — run setup_masters.py first.")
        mapping[name] = found[0]["name"]
    return mapping


def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("csv_path", type=Path, help="path to the items CSV")
    parser.add_argument("--execute", action="store_true",
                        help="actually create the items (default: dry run)")
    parser.add_argument("--env", help="path to .env file")
    args = parser.parse_args()

    rows = read_rows(args.csv_path)
    if not rows:
        sys.exit("CSV contains no data rows.")
    errors, warnings = validate(rows)
    for warning in warnings:
        print(f"! {warning}")
    if errors:
        for error in errors:
            print(f"✗ {error}", file=sys.stderr)
        sys.exit(f"\n{len(errors)} validation error(s) — nothing sent.")
    print(f"✓ {len(rows)} rows validated ({len(warnings)} warning(s))\n")

    if not args.execute:
        for row in rows:
            reorder = (
                f" | reorder {row['reorder_level']}/{row.get('reorder_qty', '')} "
                f"@ {row['reorder_warehouse']}"
                if row.get("reorder_level") else ""
            )
            flags = "".join(
                tag for tag, field in ((" [serial]", "has_serial_no"),
                                       (" [batch]", "has_batch_no"))
                if row.get(field) == "1"
            )
            print(f"  would create {row['item_code']}: {row['item_name']} "
                  f"[{row['item_group']}]{flags}{reorder}")
        print("\nDry run only — re-run with --execute to create these items.")
        return

    client = ERPNextClient.from_env(args.env)
    warehouse_map = resolve_warehouses(client, rows)
    created = skipped = failed = 0
    for row in rows:
        code = row["item_code"]
        if client.get_list("Item", filters={"item_code": code}, fields=["name"]):
            print(f"- skip {code} (already exists)")
            skipped += 1
            continue
        try:
            client.insert_doc("Item", build_doc(row, warehouse_map))
        except ERPNextError as exc:
            print(f"✗ {code}: {exc}", file=sys.stderr)
            failed += 1
        else:
            print(f"✓ created {code}")
            created += 1
    print(f"\nDone: {created} created, {skipped} skipped, {failed} failed.")
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
