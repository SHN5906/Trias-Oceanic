# Custom Fields

All fields created via **Customize Form** (no custom app). In ERPNext v15, Customize Form automatically prefixes fieldnames with `custom_` — the names below are the final stored fieldnames, and they match the columns in `data-import/items-template.csv` and what `scripts/import_items.py` sends.

## Item

| Fieldname | Label | Type | Insert after | Options |
|---|---|---|---|---|
| `custom_oem_part_number` | OEM Part Number | Data | Brand (`brand`) | In List View ✓, In Standard Filter ✓ |
| `custom_machine_compatibility` | Machine Compatibility | Small Text | OEM Part Number | shown in quotation item lookup via search fields (below) |

**Search tuning**: in Customize Form → Item, add `custom_oem_part_number` to *Search Fields* so sales reps can find an item by OEM reference directly from a quotation line.

## Use native fields — do not recreate these

ERPNext already has fields that cover other Trias needs; use them instead of new custom fields:

| Need | Native field on Item |
|---|---|
| HS code for customs | `customs_tariff_number` |
| Country of origin | `country_of_origin` |
| Supplier lead time | `lead_time_days` |
| Buffer stock | `safety_stock` |
| Reorder point/qty per warehouse | `reorder_levels` child table |

## Creation procedure

1. Settings → **Customize Form** → select DocType **Item**
2. Scroll to the field after which the new field goes, click **Insert Above/Below**
3. Set Label, Type, and options per the table — the fieldname auto-generates with the `custom_` prefix; verify it matches this document exactly (the import script depends on it)
4. **Update** and reload
5. Test: open an item, fill both fields, confirm they appear in list view and filters

## Record keeping

No custom app means customizations live only in the site database (covered by Frappe Cloud backups). This file is the source of truth — any field added later must be recorded here first.
