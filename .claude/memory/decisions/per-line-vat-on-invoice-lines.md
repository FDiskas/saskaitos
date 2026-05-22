---
name: per-line-vat-on-invoice-lines
description: VAT stored and edited per line item; invoice toggle enables VAT and global rate applies to all lines as bulk action.
keywords: [vat, pvm, line-item, totals, invoice, bulk-update]
created: 2026-05-22
updated: 2026-05-22
---

**Fact / Rule:** PVM tarifas laikomas kiekvienoje `LineItem` eilutėje (`vatRate`), o `Invoice.totals()` PVM sumą skaičiuoja sumuodamas visų eilučių PVM.

**Why:** Reikėjo leisti skirtingą PVM tarifą kiekvienai prekei/paslaugai ir gauti teisingą bendrą "Iš viso" sumą mišriems tarifams.

**How to apply:**

- Jei `invoice.vat.enabled === false`, PVM suma = 0.
- Jei `invoice.vat.enabled === true`, naudoti kiekvienos eilutės `vatRate`.
- `withVat(rate)` naudojamas kaip „taikyti visoms eilutėms“ veiksmas ir kartu nustato default tarifą naujoms eilutėms.
- Senų DTO migracijai, kai eilutė neturi `vatRate`, fallback į `invoice.vat.rate` per deserializaciją.
