# Planas: Sąskaitų išrašymo SPA su Google Drive backendu

## Context

Tikslas — sukurti pilnai client-side React SPA, kuri leidžia prisijungusiems su Google vartotojams išrašinėti savo veiklos sąskaitas. Visas duomenų sluoksnis (klientai, sąskaitos, PDF, dizaino šablonai) saugomas vartotojo Google Drive paskyroje, todėl nereikia nei DB, nei backendo, nei hostingo mokesčių už serverius. Sąskaitos eksportuojamos kaip PDF / Excel arba siunčiamos paštu per Resend (vartotojas pats įveda savo Resend API raktą — be proxy).

Šis dokumentas — vykdomas planas vibe-coding ciklui (Cursor / Claude Code / Lovable). Kiekvienas etapas yra atskiras "prompt + acceptance criteria" blokas, kurį galima vykdyti nepriklausomai.

## Suderinti sprendimai

| Sritis | Sprendimas |
|---|---|
| Resend API raktas | Vartotojas įveda savo raktą Nustatymuose, saugomas `settings.json` Drive'e (NE localStorage) |
| PDF generatorius | `@react-pdf/renderer` (atskiras React tree PDF'ui) |
| PVM | Konfigūruojamas — jungiklis kiekvienos sąskaitos lygyje, tarifas (21/9/5/0%) iš pasirinkimo |
| Numeracija | Auto su konfigūruojamomis serijomis (prefix + starting number, kelios serijos lygiagrečiai) |

## Tech stack

- **Package manager:** `pnpm` (visur — niekada `npm` ar `yarn`)
- **Build:** Vite + React 19 + TypeScript (strict, `noUncheckedIndexedAccess`)
- **UI:** Tailwind CSS v4 + Shadcn UI (`new-york` style)
- **Server state:** TanStack Query v5 — su Optimistic Updates ir mutation queue
- **Forms:** React Hook Form + Zod resolver
- **Validation:** Zod (visiems Drive JSON failams ir formoms)
- **Auth:** Google Identity Services (GIS) — `@react-oauth/google` token flow
- **Drive API:** native `fetch` per `DriveClient` (mažesnis bundle, decorator-style retry layers)
- **PDF:** `@react-pdf/renderer`
- **Excel:** `xlsx` (SheetJS)
- **Email:** Resend REST API tiesiai iš naršyklės su vartotojo raktu
- **Router:** TanStack Router
- **Icons:** `lucide-react`
- **Tests:** Vitest + @testing-library/react + happy-dom (co-located `*.test.ts`)

## Google Drive duomenų struktūra

```
Saskaitos_App/                          (sukuriama pirmojo login metu)
├── clients.json                        Klientų sąrašas + ID indeksas
├── settings.json                       Globalūs nustatymai: serijos, šablonai, Resend key, įmonės rekvizitai
└── Clients/
    └── Client_{slug}_{shortId}/
        ├── profile.json                Kliento detalės
        ├── invoices_index.json         Šio kliento sąskaitų lista (numeris, data, suma, status)
        └── {YYYY}/
            ├── {YYYY-MM-DD}_{invoiceNo}.json   Žali sąskaitos duomenys (snapshot)
            └── {YYYY-MM-DD}_{invoiceNo}.pdf    Generuotas PDF
```

**Svarbu:** OAuth scope = `drive.file` (ne `drive`) — taip aplikacija mato tik savo sukurtus failus, ne visą Drive. Paskyros saugumas — vartotojo komfortui.

## Projekto failų struktūra

Visi `*.test.ts` co-located šalia kodo. Domain layer (value objects + Invoice entity) yra savarankiškas — be React, be I/O, 100% pure ir tinkamas vienetiniams testams.

```
src/
├── main.tsx
├── App.tsx
├── routes/                     Puslapiai (route components)
│   ├── login.tsx
│   ├── dashboard.tsx           Sąskaitų sąrašas + filtrai
│   ├── clients.tsx
│   ├── invoice-editor.tsx      Pagrindinis editorius
│   └── settings.tsx
├── components/
│   ├── ui/                     Shadcn komponentai (generated)
│   ├── invoice/                InvoiceCanvas, InlineEditField, LineItemsTable, DesignSidebar
│   └── shared/                 SyncStatusBadge, ClientCombobox
├── hooks/
│   ├── useGoogleAuth.ts        Login, token refresh, logout
│   ├── useClients.ts           CRUD su React Query + optimistic
│   ├── useInvoice.ts           Single invoice query
│   ├── useInvoiceList.ts       Agregacija per visus klientus
│   ├── useInvoiceMutations.ts  create / update / delete
│   ├── useInvoiceStatus.ts     status pakeitimai (invoice + index sync)
│   └── useSettings.ts
├── lib/
│   ├── domain/                 Value Objects + Entities — PURE, be React, be I/O
│   │   ├── Money.ts
│   │   ├── Money.test.ts
│   │   ├── VatRate.ts
│   │   ├── VatRate.test.ts
│   │   ├── InvoiceNumber.ts
│   │   ├── InvoiceNumber.test.ts
│   │   ├── InvoiceId.ts
│   │   ├── ClientId.ts
│   │   ├── LineItem.ts
│   │   ├── LineItems.ts        First-class collection
│   │   ├── Invoice.ts          Entity su Tell-Don't-Ask metodais
│   │   ├── Invoice.test.ts
│   │   ├── Client.ts
│   │   └── Series.ts           atomic nextNumber()
│   ├── storage/                Abstrakcija — hooks priklauso nuo Storage, ne nuo DriveClient
│   │   ├── Storage.ts          interface { read, write, uploadBinary, list }
│   │   ├── DriveStorage.ts     Drive implementacija
│   │   ├── InMemoryStorage.ts  Testams + dev mode
│   │   └── StoragePath.ts      Value object: kelias kaip { folder, name }
│   ├── drive/                  Žemo lygio HTTP — naudoja DriveStorage
│   │   ├── DriveClient.ts      Kompozicija (Auth → TokenRefreshRetry → BackoffRetry → fetch)
│   │   ├── http/
│   │   │   ├── AuthInterceptor.ts
│   │   │   ├── TokenRefreshRetry.ts
│   │   │   ├── BackoffRetry.ts
│   │   │   └── *.test.ts       (po vieną kiekvienam)
│   │   └── schemas.ts          Zod schemas Drive payload'ams
│   ├── pdf/
│   │   └── InvoicePdfDocument.tsx   @react-pdf/renderer template
│   ├── excel/
│   │   ├── invoiceToXlsx.ts
│   │   └── invoiceToXlsx.test.ts
│   ├── resend/
│   │   ├── sendInvoiceEmail.ts
│   │   └── sendInvoiceEmail.test.ts
│   └── format/
│       ├── date.ts
│       └── date.test.ts
├── stores/
│   └── syncQueue.ts            Sequential mutation queue (rate-limit apsauga)
├── query-keys.ts               Visos TanStack Query key konstantos
└── test/
    └── setup.ts                vitest setup
```

## Implementation phases

Kiekvienas etapas = vienas vibe-coding promptas. Pereik nuosekliai, po kiekvieno paleisk `pnpm dev` ir patikrink acceptance criteria.

---

### Etapas 0 — Bootstrap

**Promptas:**
```
Inicijuok Vite + React 19 + TypeScript projektą per pnpm (`pnpm create vite`). NIEKADA nenaudok npm ar yarn — visur tik pnpm. Lockfile = pnpm-lock.yaml.

Pridėk:
- Tailwind v4 (native @tailwindcss/vite plugin, be PostCSS)
- Shadcn UI (new-york style, slate base) — `pnpm dlx shadcn@latest init`
- lucide-react
- TanStack Query v5, TanStack Router
- React Hook Form + zod + @hookform/resolvers
- @react-oauth/google
- Vitest + @testing-library/react + @testing-library/jest-dom + happy-dom

Sukurk failų struktūrą pagal plano dalį "Projekto failų struktūra" (tuščius failus su barrel exportais). Co-located *.test.ts šalia kiekvieno *.ts.

tsconfig.json: strict + noUncheckedIndexedAccess + verbatimModuleSyntax. Path alias "@/*" -> "src/*".

vitest.config.ts: happy-dom environment, setupFiles = ['src/test/setup.ts'], globals: true.

package.json scripts: dev, build, test, test:watch, lint, typecheck.

Sukurk .env.example su VITE_GOOGLE_CLIENT_ID.

Pridėk eslint + prettier su React Query plugin'u.

Sukurk CLAUDE.md projekto šaknyje pagal plano sekciją "Clean code taisyklės".
```

**Acceptance:** `pnpm dev` paleidžia, `pnpm build` praeina be type errors, `pnpm test` veikia (0 testų — bet runner paleidžiamas).

---

### Etapas 0.5 — Domain layer (pure, be React, TDD)

Šis etapas yra **prieš bet kokį UI**. Pastatomas patikimas pamatas, kuriuo pasitiki visi vėlesni etapai. Privaloma TDD: kiekviena funkcija = pirma raudonas testas, tada implementacija, tada refactor.

**Promptas:**
```
Sukurk lib/domain/ aplanke pure Value Objects ir Entities. NĖRA React, NĖRA fetch, NĖRA window. Tik TypeScript + Zod + vitest.

Naudok TDD griežtai: kiekvienas failas — pirma .test.ts (raudonas), tada implementacija (žalias), tada refactor.

1. Money.ts — immutable value object
   - constructor(amount: number, currency = 'EUR')
   - add(other: Money), subtract(other: Money), multiply(scalar: number)
   - currency mismatch → meta CurrencyMismatchError
   - format(locale = 'lt-LT'): string  → "1 234,56 €"
   - equals(other: Money), isZero(), isNegative()
   - Vidinis storage = integer cents (NE float — vengiam IEEE 754 klaidų)
   - Statinis Money.zero(currency), Money.fromCents(cents, currency)
   - Testai: 0.1 + 0.2 === 0.3 (kritinis!), banker's rounding 2.125 → 2.12, currency mismatch klaida

2. VatRate.ts
   - Statinis VatRate.of(percent: 0 | 5 | 9 | 21)
   - apply(net: Money): { net, vat, gross }
   - Testai: 100 EUR @ 21% = { net: 100, vat: 21, gross: 121 }

3. InvoiceId.ts, ClientId.ts — branded ID value objects
   - private constructor — niekas negali sukurti raw
   - static create() → naujas UUID v7
   - static fromString(s) — validacija formatu

4. InvoiceNumber.ts
   - Reprezentuoja suformatuotą numerį (pvz. "SF2026-0001")
   - Series.ts — { id, prefix, nextNumber, isDefault }, su next(): { number: InvoiceNumber, updatedSeries: Series } — pure, immutable
   - Testai: increment'as nepakeičia originalo (immutability), padding į 4 skaitmenis

5. LineItem.ts — { id, description, quantity, unit, unitPrice: Money }
   - total(): Money  → unitPrice.multiply(quantity)

6. LineItems.ts — first-class collection (NE raw array)
   - add(item), remove(id), update(id, patch), reorder(from, to)
   - subtotal(): Money — sumuoja per visus
   - count(): number, isEmpty(): boolean
   - Iterable<LineItem>

7. Invoice.ts — entity (Tell-Don't-Ask)
   - { id, number, seriesId, clientId, issueDate, dueDate, lineItems: LineItems, vat: { enabled, rate }, status, notes?, designPresetId, createdAt, updatedAt }
   - totals(): { subtotal: Money, vatAmount: Money, total: Money }
   - withLineItem(item), withoutLineItem(id), withVat(rate), markPaid(), markSent(), markOverdue()
   - VISI metodai grąžina NAUJĄ Invoice (immutability)
   - isOverdue(today: Date): boolean
   - Testai: status transitions, totals teisingumas su PVM ir be PVM, immutability

8. Client.ts — value object { id: ClientId, name, code?, vatCode?, address, ... }
   - slug(): string — naudojamas folder name

9. Zod schemas — atskirai nuo domain (lib/drive/schemas.ts). Schemos validuoja serialized JSON formą, parse'inus → grąžina domain objektus (Money.fromCents, t.t.). Sukurk toDto() / fromDto() funkcijas konvertavimui.
```

**Acceptance:**
- `pnpm test` — visi domain testai žali, coverage > 90% lib/domain/
- `pnpm typecheck` — be klaidų
- Niekur lib/domain/ aplanke nėra `import` iš React, fetch, window, ar Drive
- 0.1 + 0.2 testas praeina (kritinė check'a)
- Invoice metodai grąžina naują instance (test'as: `inv !== inv.markPaid()`)

---

### Etapas 1 — Storage abstrakcija, Google Auth, Drive bootstrap

Šiame etape kuriam Dependency Inversion pamatą: visi vėlesni etapai dirbs per `Storage` interface, NE tiesiogiai per Drive HTTP. Tai leis testuoti su `InMemoryStorage` ir vystyti dev mode'ą be Google login.

**Promptas:**
```
ŽINGSNIS 1 — Storage interface (TDD pirma):

lib/storage/Storage.ts:
interface Storage {
  read<T>(path: StoragePath, schema: ZodType<T>): Promise<T | null>
  write<T>(path: StoragePath, data: T): Promise<void>
  uploadBinary(path: StoragePath, blob: Blob, mimeType: string): Promise<void>
  list(folder: string, query?: ListQuery): Promise<StorageEntry[]>
  delete(path: StoragePath): Promise<void>
}

lib/storage/StoragePath.ts — value object { folder: string, name: string }.

lib/storage/InMemoryStorage.ts — pilnai veikiantis Map<string, unknown>-based implementacija. Naudosim testuose ir dev mode'e (jei nustatytas VITE_USE_IN_MEMORY=1, pakeičia DriveStorage).

Co-located testai: rašom kontrakto testus prieš implementacijas. InMemoryStorage testas tampa baseline'u, prieš kurį turės pereiti ir DriveStorage.

ŽINGSNIS 2 — Google Auth:

@react-oauth/google su Implicit Flow (token client). Scope: 'openid email profile https://www.googleapis.com/auth/drive.file'.

hooks/useGoogleAuth.ts:
- Token saugomas memory (NE localStorage — XSS rizika), refresh ~55 min interval'u
- Klaidos atveju silent re-auth per prompt: 'none'
- Eksportuoja: { user, accessToken, login, logout, isAuthenticated }

ŽINGSNIS 3 — DriveClient decomposed (Decorator pattern, SRP):

lib/drive/http/AuthInterceptor.ts — vienintelė atsakomybė: prideda Bearer header.
lib/drive/http/TokenRefreshRetry.ts — vienintelė atsakomybė: 401 → trigger refresh → retry vieną kartą.
lib/drive/http/BackoffRetry.ts — vienintelė atsakomybė: 429/5xx → exponential backoff (3 bandymai, 250ms / 500ms / 1000ms).

Visi 3 implementuoja tą patį `interface Fetcher { fetch(req: Request): Promise<Response> }`. Kompozicija per konstruktorius (klasikinis Decorator):

new BackoffRetry(new TokenRefreshRetry(new AuthInterceptor(window.fetch, tokenSource), tokenSource))

Co-located testai kiekvienam decorator'iui atskirai: mock'iname `Fetcher` ir tikriname tik vieno layer'io elgesį.

lib/drive/DriveClient.ts — facade su metodais files.list, files.create, files.get, files.update, multipart upload.

ŽINGSNIS 4 — DriveStorage:

lib/storage/DriveStorage.ts implements Storage:
- Naudoja DriveClient
- findOrCreateFolder(name, parentId?) (caching per session)
- read → DriveClient.files.get + Zod parse
- write → multipart upload arba PATCH

Kontrakto testai (tie patys kaip InMemoryStorage) turi praeiti.

ŽINGSNIS 5 — Bootstrap:

lib/storage/bootstrap.ts: ensureAppStructure(storage: Storage):
- Sukuria "Saskaitos_App/" + tuščius clients.json ir settings.json jei dar nėra
- Idempotent

ŽINGSNIS 6 — Login puslapis:

shadcn Card su "Prisijungti su Google" mygtuku. Po login → redirect /dashboard, fone runninasi bootstrap. Loading state per Suspense + TanStack Query.

App-level provider injectina vieną Storage instance (DriveStorage produkcijoje, InMemoryStorage testuose / dev mode'e).
```

**Acceptance:**
- `pnpm test` — InMemoryStorage ir DriveStorage praeina tuos pačius kontrakto testus
- `pnpm test` — visi 3 HTTP decorator'iai turi izoliuotus testus (mock'inami su MSW arba tiesiog stub'ai)
- Prisijungus pirmą kartą Drive'e atsiranda `Saskaitos_App/` su 2 JSON failais
- Antrą kartą prisijungus — nieko nesukuria pakartotinai
- `VITE_USE_IN_MEMORY=1 pnpm dev` — aplikacija veikia be Google login (su seed duomenimis)

---

### Etapas 2 — Settings ir įmonės rekvizitai

**Promptas:**
```
Sukurk lib/drive/schemas.ts su Zod schema "Settings":
{
  company: { name, code, vatCode?, address, iban, bankName, email, phone, logoBase64? },
  series: Array<{ id, prefix, nextNumber, isDefault }>,  // pvz. SF2026-, INV-
  resendApiKey?: string,
  defaultEmailSubject?: string,
  defaultEmailBody?: string,
  designPresets: Array<{ id, name, primaryColor, accentColor, fontFamily, backgroundImageBase64? }>
}

hooks/useSettings.ts: useQuery + useMutation per Drive. Mutacija — optimistic update.

Settings puslapis (shadcn Tabs):
- Tab "Įmonė": forma su RHF + zod, logo upload (konvertuoja į base64)
- Tab "Serijos": lentelė + "Pridėti seriją" dialog
- Tab "Email": Resend API key (password input + show/hide), default subject/body
- Tab "Dizaino šablonai": šablonų sąrašas, "Naujas šablonas" su spalvų picker'iais ir bg image upload

Visi pakeitimai automatiškai writinami į settings.json. Pridėk SyncStatusBadge (Idle / Syncing / Synced / Error) viršuje.
```

**Acceptance:** Pakeitus įmonės pavadinimą — po ~1s Drive'e settings.json atsinaujina. Refresh puslapio — duomenys lieka.

---

### Etapas 3 — Klientų CRUD

**Promptas:**
```
Zod schema "Client":
{ id, name, code?, vatCode?, address, email?, phone?, contactPerson?, notes?, createdAt, updatedAt }

hooks/useClients.ts:
- useClients() → useQuery cache key ['clients']
- useCreateClient, useUpdateClient, useDeleteClient — visi optimistic
- onError rollback į ankstesnį cache snapshot
- Po success: ensure kliento Drive aplankas egzistuoja (Client_{slugify(name)}_{id.slice(0,6)})

Clients puslapis:
- shadcn DataTable su paieška, sorting (TanStack Table)
- "Naujas klientas" — shadcn Dialog su forma
- Row actions: Edit (Dialog), Delete (AlertDialog su patvirtinimu)
- Empty state: graži iliustracija + CTA

Naudok ClientCombobox kaip reusable komponentą (vėliau invoice editoriuje).
```

**Acceptance:** Sukūrus klientą — Drive `Clients/` atsiranda naujas aplankas su `profile.json` ir `invoices_index.json` (tuščias array). Trynus — aplankas pažymimas trashed (NE hard delete).

---

### Etapas 4 — Invoice editorius su inline edit

PASTABA: domain layer'is (Money, VatRate, Invoice, LineItems, Series) jau egzistuoja iš Etapo 0.5. Šiame etape kuriam tik UI ir persistence wiring. **NIEKUR komponente neturi būti `qty * price` ar tiesioginė number aritmetika** — visi skaičiavimai per `invoice.totals()` ir `Money` metodus.

**Promptas:**
```
Drive serialization (lib/drive/schemas.ts):
- InvoiceDto Zod schema atspindi Invoice serialized formą (Money → integer cents)
- toDto(invoice: Invoice): InvoiceDto, fromDto(dto: InvoiceDto): Invoice

Invoice editorius (/invoice-editor/:id arba /new):
LAYOUT: kairėje DesignSidebar (220px), centre InvoiceCanvas (A4 aspect), nieko dešinėje.

InvoiceCanvas komponentai (visi < 200 eilučių, vienas indentation level kai įmanoma):
- InlineEditField — span/div, paspaudus virsta input/textarea. contentEditable + onBlur commit. Tipas: `<T>` su parse/format props.
- LineItemsTable — dirba per `invoice.lineItems` (LineItems first-class collection). "+ Pridėti eilutę" → `invoice.withLineItem(...)`. Trash → `invoice.withoutLineItem(id)`. Drag reorder (dnd-kit) → `lineItems.reorder(from, to)`.
- TotalsBox — rodo `invoice.totals()` rezultatą. NĖRA useMemo skaičiavimo komponente.
- VatToggle — Switch + Select tarifo (0/5/9/21%) → `invoice.withVat(VatRate.of(21))`.

DesignSidebar:
- Šablono pasirinkimas (dropdown su preview)
- Quick edit: primary color, bg image upload (base64 → invoice-level override)

Visi pakeitimai → debounced (500ms) autosave per useInvoiceMutations.update → toDto(invoice) → storage.write į kliento aplanką + atnaujina invoices_index.json (per syncQueue).

useInvoiceMutations.create:
- Skaito settings, paima default Series
- series.next() → { number, updatedSeries }
- Atomic: išsaugo invoice + atnaujina settings.json su updatedSeries TOJE PAČIOJE syncQueue operacijoje. Jei kuri nors save fail'ina — abu rollback.
```

**Acceptance:**
- Sukūrus naują sąskaitą — Drive'e atsiranda `2026-MM-DD_SF2026-0001.json`, kliento `invoices_index.json` papildomas, settings.json series.nextNumber inkrementuotas
- Pakeitus kiekį — total perskaičiuojamas akimirksniu (`invoice.totals()`), po 500ms Drive update
- `pnpm test` — Invoice entity testai pakankami padengti totals logikai; komponentų testai padengti tik UI bindings
- Tipų check'as: niekur kode `invoice.lineItems[0].quantity * invoice.lineItems[0].unitPrice` — privalo būti `invoice.lineItems.get(id).total()` ar pan.

---

### Etapas 5 — PDF, Excel, Email eksportas

**Promptas:**
```
lib/pdf/InvoicePdfDocument.tsx — @react-pdf/renderer komponentas, atspindintis InvoiceCanvas išvaizdą:
- Naudok Font.register įrašyti Google Fonts (Inter, Roboto)
- Background image per <Image> absolute positioned
- Lentelė per Flexbox
- Header/Footer su įmonės rekvizitais

Eksporto bar (sticky top, invoice editoriuje):
- "Download PDF" → pdf(<InvoicePdfDocument invoice={...} settings={...} />).toBlob() → triggerina download + uploadBinary į Drive (kliento {YYYY}/ aplanką su tuo pačiu basename)
- "Download Excel" → lib/excel/invoiceToXlsx.ts naudoja xlsx (SheetJS). Vienas sheet "Sąskaita" su header + line items + totals.
- "Siųsti el. paštu" → atveria EmailDialog

EmailDialog:
- Form: to, cc?, subject (default iš settings), body (default iš settings, palaiko `{{client.name}}`, `{{invoice.number}}` placeholderius)
- "Pridėti PDF" checkbox (default on)
- Send button → lib/resend/sendInvoiceEmail.ts
  - Generuoja PDF blob → base64
  - POST https://api.resend.com/emails su Bearer settings.resendApiKey
  - { from: settings.company.email, to, subject, html: body, attachments: [{ filename, content: base64 }] }
  - 401/403 → toast "Patikrinkite Resend API raktą Nustatymuose"
  - 200 → toast success + log į invoice.history (jei pridėsi vėliau)

Jei resendApiKey neįvestas — disable "Siųsti" mygtuką + tooltip "Įveskite raktą Nustatymuose".
```

**Acceptance:**
- PDF Drive'e atsiranda greta JSON failo
- Excel'is atsiunčiamas su teisingomis sumomis ir PVM (jei įjungtas)
- Email pasiekia gavėją su PDF priedu (testuok su realiu Resend acc + verifikuotu domenu)

---

### Etapas 6 — Dashboard, filtrai, statusas

**Promptas:**
```
hooks (SRP — kiekvienas hook turi vieną atsakomybę):
- useInvoiceList() — agreguoja iš VISŲ klientų invoices_index.json (lygiagrečiai per Promise.all)
- useInvoiceStatus(clientId): { setStatus(invoiceId, status) } — optimistic, updatina ir invoice.json, ir invoices_index.json per syncQueue. Naudoja `invoice.markPaid()` / `markSent()` / `markOverdue()` (Tell-Don't-Ask).

Dashboard puslapis:
- KPI kortelės viršuje: "Šį mėnesį išrašyta", "Laukia mokėjimo", "Vėluoja", "Apmokėta YTD"
- DataTable: Data | Numeris | Klientas | Suma | Statusas | Veiksmai
- Statusas — shadcn Badge su click → Popover su 4 statusais (Draft/Sent/Paid/Overdue), spalvos: gray/blue/green/red
- Filtrai virš lentelės: paieška (numeris/klientas), klientas (combobox), status (multi-select), date range
- Row click → /invoice-editor/:id

Background job: kiekvieną kartą atidarius Dashboard — `invoice.isOverdue(new Date())` filter ant Sent sąskaitų → auto-mark "Overdue" (su patvirtinimu? Ne — tiesiog flag'inam). Logika TIK Invoice entity'je, ne komponente.

stores/syncQueue.ts — sequential mutation queue (visos Drive mutations eina viena po kitos, kad nesusidurtų su 429 ir race conditions tarp invoices_index.json rašymų).
```

**Acceptance:**
- Statuso pakeitimas — UI atsinaujina iškart, Drive'e per ~1s
- Greitai paspaudus 5x skirtingus statusus — galutinis nustatomas teisingas (queue veikia)
- Filtrai veikia kombinuotai

---

## Clean code taisyklės (CLAUDE.md)

Įdėk projekto šaknyje kaip `CLAUDE.md`:

```
# Bendri principai
- Package manager: pnpm visada. Niekur npm ar yarn.
- Atsakymai į user'į: lietuviškai.

# TypeScript
- NEVER `any`. NEVER `unknown` cast'ai be Zod parse.
- Visi externi duomenys (Drive, Resend, localStorage) — per Zod schema.
- noUncheckedIndexedAccess turi būti įjungtas.

# Domain layer (lib/domain/)
- Raw primitives draudžiami domain konceptams. Naudok value objects: Money, VatRate, InvoiceId, ClientId, InvoiceNumber.
- Money skaičiavimai TIK per `Money` klasę. Niekur `+ - * /` su number'iais, kurie reiškia pinigus.
- Visi value objects ir entities — immutable. Mutating metodai grąžina naują instance (`withFoo()`, ne `setFoo()`).
- Domain klasė NEGALI import'inti iš React, fetch, window, lib/drive, lib/storage. Tik TypeScript + Zod (schemoms tik).
- First-class collections: LineItems, ne `LineItem[]`. Komponentai dirba per kolekcijos metodus.

# Architektūra
- DIP: hooks priklauso nuo `Storage` interface, ne nuo `DriveClient` ar `DriveStorage`. Production wires DriveStorage, testai — InMemoryStorage.
- SRP: kiekvienas modulis, klasė, hook turi vieną atsakomybę. Jei pavadinimas turi "And" arba "Manager" — skaidyk.
- Decorator pattern HTTP layer'iui: AuthInterceptor / TokenRefreshRetry / BackoffRetry — kiekvienas atsakingas už vieną dalyką.
- Hooks po vieną atsakomybę: useInvoice, useInvoiceList, useInvoiceMutations, useInvoiceStatus — NEJUNGTI į useInvoices.

# Komponentai
- < 200 eilučių. Jei daugiau — extract.
- < 10 eilučių per metodą/funkciją.
- Tell-Don't-Ask: komponentai kviečia entity metodus (`invoice.totals()`), ne skaičiuoja patys.
- Drive mutacijos TIK per hooks/use*. Komponentai NEKVIETA storage tiesiai.
- Vengti `else` — early return.
- Niekur object lookup per `key in obj` ant untrusted strings — `Object.hasOwn(obj, key)`.

# TDD
- Kiekviena pure funkcija lib/domain/ ir lib/utils/ — co-located .test.ts.
- Red-Green-Refactor. Nerašyk production kodo be raudonos test'os.
- Test pavadinimai: "when X, then Y" (konkretūs, ne abstraktūs).

# Patterns
- Optimistic updates VISOMS mutacijoms — UI niekada nelaukia tinklo.
- TanStack Query keys — konstantos src/query-keys.ts.
- Tailwind v4: @theme inline custom properties, ne tailwind.config.ts.
- syncQueue — visos Drive mutacijos eina sequential, kad nesusikirstų lygiagrečios atnaujinimus į tą patį JSON.

# YAGNI / Rule of Three
- Nestatyk abstrakcijų prieš trečią duplikaciją.
- Nerašyk kodo "ateičiai" jei dabar nereikia.
- Šalink dead code iškart, ne komentuok.
```

## Žinomi rizikos taškai

1. **Google OAuth token expiration (1h):** useGoogleAuth privalo turėti `setInterval` refresh ~55 min, klaidos atveju — silent re-auth per `prompt: 'none'`. Pamiršus — vartotoją išmes vidurį sąskaitos.
2. **Drive eventual consistency:** Po writeJson, readJson tuo pačiu ID per ~500ms gali grąžinti seną versiją. Visada updatink local cache per setQueryData, ne per invalidate+refetch.
3. **invoices_index.json race condition:** Du paraleliniai mutationai gali perrašyti vienas kitą. Sprendimas — sequential syncQueue + visada read-modify-write su fresh fetch index'o viduje mutationFn (ne iš cache).
4. **Resend domenas:** Resend reikalauja verified domain `from` adresui. Settings UI turi parodyti aiškų error message + linką į resend.com/domains.
5. **CORS:** Resend API palaiko browser fetch (yra CORS headers). Patikrinta — veikia be proxy.
6. **Bundle size:** @react-pdf/renderer + xlsx — sunkūs. Lazy load per `React.lazy` ir route-level code splitting.

## Verifikacija (end-to-end)

Po etapo 6:

**Test suite (automated):**
1. `pnpm test` — visi domain testai žali, coverage > 90% lib/domain/
2. `pnpm test` — Storage kontrakto testai praeina ir InMemoryStorage, ir DriveStorage (su mocked fetch)
3. `pnpm test` — HTTP decorator testai: 401 trigger'ina refresh, 429 backoff'ina, AuthInterceptor prideda header
4. `pnpm typecheck` — be klaidų
5. `pnpm build` — bundle size target < 800KB gzipped main chunk po code splitting

**E2E manual:**
6. `pnpm dev` → http://localhost:5173
7. Dev mode be Google: `VITE_USE_IN_MEMORY=1 pnpm dev` — aplikacija veikia su seed duomenimis
8. Login su Google, accept'ink `drive.file` scope
9. Drive web UI: patikrink ar atsirado `Saskaitos_App/` su `clients.json` + `settings.json`
10. Settings: užpildyk įmonės rekvizitus, sukurk seriją `SF2026-`, įvesk Resend API key
11. Sukurk klientą "UAB Testas" → Drive'e turi atsirasti `Clients/Client_uab-testas_xxxxxx/`
12. Sukurk sąskaitą tam klientui:
    - 2 line items, vienas su VAT 21%
    - Patikrink totals (0.1 + 0.2 case turi būti tikslus)
    - Inline edit įmonės pavadinimą — turi save'intis
13. Eksportas:
    - PDF download — atidaryk, patikrink layout
    - Excel — atidaryk, patikrink sumas
    - Email — siųsk į savo paštą su Resend (turi pasiekti su PDF priedu)
14. Drive: patikrink ar yra `.json` ir `.pdf` greta vienas kito kliento `2026/` aplanke
15. Dashboard: pakeisk statusą į "Paid" → reload puslapio → statusas išliko
16. Refresh naršyklę 5x iš eilės keičiant statusus — patikrink, kad nei vienas pakeitimas nepradingo (syncQueue test)

## Pirmasis žingsnis

Vykdyk Etapą 0 prompt. Po to — **Etapas 0.5 (Domain layer, TDD)** prieš bet ką UI'ne. Tarp etapų — commit'ink (`git`), kad gali rollback'inti jei AI ką sugadina. Po kiekvieno etapo paleisk `pnpm test && pnpm typecheck` prieš commit'inant.
