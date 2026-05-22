---
name: lazy-load-pdf-xlsx
description: Heavy export deps (@react-pdf/renderer + xlsx) split via dynamic import to keep main bundle small
keywords: [bundle, lazy-load, pdf, xlsx, code-split, dynamic-import, performance]
created: 2026-05-22
updated: 2026-05-22
---

**Fact / Rule:** `@react-pdf/renderer` ir `xlsx` niekur neimportuojami statiškai iš kodo, kuris pasiekiamas pirmu page load. Pasiekiama tik per dynamic import wrapper'ius:
- `src/lib/pdf/generateInvoicePdf.tsx` → `generateInvoicePdfBlob(...)` lazy-importuoja `@react-pdf/renderer` + `InvoicePdfDocument`.
- `src/lib/excel/invoiceToXlsx.ts` → `exportInvoiceToXlsx(...)` yra async ir `await import('xlsx')` viduje.

**Why:** Abi bibliotekos sunkios (`xlsx` ~143 KB gz, `@react-pdf/renderer` ~493 KB gz). Statinis import išpučia main chunk per planą limitą (`< 800 KB gz`). Po lazy load main = 196 KB gz, PDF/xlsx eksportas — pirma paspaudimo metu.

**How to apply:** Pridedant naujas export funkcijas — niekada `import * as XLSX from 'xlsx'` ar `import { pdf } from '@react-pdf/renderer'` ant top-level modulio, kuris pasiekiamas pirmo render metu. Vietoj — pridėk į esamus wrapper'ius arba sukurk naują dynamic-import gateway. Susiję: [[no-backend-architecture]].
