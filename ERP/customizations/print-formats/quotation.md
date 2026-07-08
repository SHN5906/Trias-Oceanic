# Print Format — Quotation with Trias Branding

Goal: a quotation PDF the client is proud to send to Ok Tedi or a government buyer. Built natively (Print Format Builder), no custom app.

## 1. Letter Head (prerequisite)

Settings → **Letter Head** → New:
- Name: `Trias Oceanic`
- Logo: reuse the wordmark from the vitrine site (`Website/` in this repo — export the TRIAS OCEANIC SVG/PNG at ~600px wide)
- Content: logo left; right block with legal name, Port Moresby address, phone, email, TIN
- Footer: bank details (PGK account; USD account for export-priced quotes), website URL
- Set as **Default Letter Head** on the Company

## 2. Print format

Settings → **Print Format** → New (or duplicate "Standard"):
- Name: `Trias Quotation`, DocType: Quotation, based on Print Format Builder
- Set as default for Quotation in Print Settings or via Customize Form → default print format

**Header block**: quotation number, date, valid-till date (make validity prominent — mining procurement cares), customer name + address, contact person, currency of the quote.

**Item table columns**: `item_code`, `custom_oem_part_number` (label "OEM Ref"), description, qty, UOM, rate, amount. OEM Ref is the column mining buyers match against their own systems — do not omit it.

**Totals**: net, taxes (GST 10% PNG where applicable), grand total; show PGK equivalent (`base_grand_total`) when quoting in USD/AUD/EUR.

**Footer**: payment terms, delivery terms (Incoterm + estimated lead time), "Prices valid subject to exchange rate at order date" clause if client wants it, signature block.

## 3. PDF settings

- A4, margins ≥ 15mm, Print Settings → letterhead ON by default
- Test the PDF from the email dialog, not just the print preview — spacing differs

## 4. Checklist

- [ ] Letter head renders with logo at correct size (no pixelation)
- [ ] 1-line and 30-line quotations both paginate cleanly
- [ ] USD quotation shows PGK equivalent total
- [ ] OEM Ref column populated (needs `custom_oem_part_number` field — see ../custom-fields.md)
- [ ] Emailed PDF identical to print preview
