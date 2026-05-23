# Sąskaitos

> Atviro kodo, **be backendo** sąskaitų faktūrų išrašymo SPA. Visi duomenys saugomi pačio vartotojo Google Drive paskyroje — jokių serverių, jokios duomenų bazės, jokio hostingo mokesčio.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built with React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev)
[![TypeScript strict](https://img.shields.io/badge/TS-strict-3178c6.svg)](https://www.typescriptlang.org/)

Repository: <https://github.com/FDiskas/saskaitos>

---

## Kas tai?

`Sąskaitos` — tai client-side React aplikacija, kuri Lietuvos individualios veiklos ir mažų UAB savininkams leidžia greitai išrašinėti sąskaitas-faktūras. Skirtumas nuo įprastų SaaS sprendimų:

- **Nėra backend'o.** Visi failai (klientai, sąskaitos, PDF, šablonai) gula į vartotojo Google Drive (`drive.file` scope — matome tik savo sukurtus failus).
- **Nėra prenumeratos.** Vienkartinis deploy'as, jokių mokesčių už serverius.
- **Nėra duomenų brokerio.** Vartotojo duomenys niekada neperžengia jo paties Google paskyros ribų.
- **Self-host friendly.** Galima paleisti lokaliai, ant Vercel/Netlify, ant savo VPS — kur tik veikia statinis hostingas.

## Funkcionalumas

- 🧾 Sąskaitų-faktūrų išrašymas su drag-and-drop šablono redaktoriumi
- 👥 Klientų valdymas (su [jars.lt](https://jars.lt) Registrų centro paieška pagal įmonės pavadinimą)
- 💶 PVM (21 / 9 / 5 / 0 %) ir kelios numeracijos serijos lygiagrečiai
- 📤 Eksportas į **PDF** (`@react-pdf/renderer`) ir **Excel** (`xlsx`)
- 📧 El. pašto siuntimas tiesiai iš naršyklės per **Resend** (vartotojo API raktas)
- 📊 Dashboard'as su KPI, pajamų grafikais ir filtravimu
- 🏢 Kelios įmonės viename profilyje (multi-company switcher)
- 🔢 Suma žodžiais lietuvių kalba
- 💾 Optimistic updates + sync queue — UI niekada nelaukia tinklo

## Tech stack

- **Build:** Vite 6 + React 19 + TypeScript (strict + `noUncheckedIndexedAccess`)
- **UI:** Tailwind CSS v4 + Shadcn UI (`new-york`)
- **Server state:** TanStack Query v5 (su optimistic updates ir mutation queue)
- **Router:** TanStack Router
- **Forms:** React Hook Form + Zod resolver
- **Auth:** Google Identity Services (`@react-oauth/google` token flow)
- **Drive API:** native `fetch` per `DriveClient` (decorator-style retry layers)
- **PDF / Excel:** `@react-pdf/renderer`, `xlsx`
- **Email:** Resend REST API (client-side, vartotojo raktas)
- **Tests:** Vitest + Testing Library + happy-dom (co-located `*.test.ts`)

## Architektūra trumpai

```
src/
├── routes/                puslapiai (TanStack Router)
├── components/            UI komponentai (clients, dashboard, invoice, settings, shared, ui)
├── hooks/                 viena atsakomybė per hook'ą (useInvoice / useInvoiceList / …)
├── lib/
│   ├── domain/            value objects + entities (Money, VatRate, Invoice, Client)
│   ├── drive/             DriveClient + Zod schemos + storage adapter
│   ├── invoice-template/  layout DSL ir block instance modelis
│   ├── pdf/               @react-pdf renderer
│   └── excel/             xlsx eksportas
└── stores/                klient-side mažos būsenos
```

### Drive duomenų struktūra

```
Saskaitos_App/                          (sukuriama pirmojo login metu)
├── clients.json                        klientų sąrašas + ID indeksas
├── settings.json                       serijos, šablonai, Resend raktas, įmonės rekvizitai
└── Clients/
    └── Client_{slug}_{shortId}/
        ├── profile.json                kliento detalės
        ├── invoices_index.json         šio kliento sąskaitų lista
        └── {YYYY}/
            ├── {YYYY-MM-DD}_{invoiceNo}.json
            └── {YYYY-MM-DD}_{invoiceNo}.pdf
```

### Architektūros principai

- **Domain layer be I/O.** `lib/domain/` neimportuoja React, fetch, window, drive ar storage — tik TypeScript + Zod (schemoms).
- **DIP.** Hook'ai priklauso nuo `Storage` interface, ne nuo `DriveClient`. Production wires `DriveStorage`, testai — `InMemoryStorage`.
- **SRP.** Vienas modulis / klasė / hook — viena atsakomybė. Jei pavadinime atsiranda *And* arba *Manager*, skaidoma.
- **Value objects.** `Money`, `VatRate`, `InvoiceId`, `ClientId`, `InvoiceNumber` — jokių raw primitives domain konceptams. Pinigų skaičiavimai TIK per `Money` klasę.
- **Decorator pattern HTTP layeriui.** `AuthInterceptor` / `TokenRefreshRetry` / `BackoffRetry` — kiekvienas atsakingas už vieną dalyką.
- **Sync queue.** Visos Drive mutacijos eina sequential, kad nesusikirstų lygiagrečios atnaujinimus į tą patį JSON.

Detaliau projekto principus rasi [CLAUDE.md](./CLAUDE.md) faile.

## Pradžia

### Reikalavimai

- Node.js ≥ 20
- [pnpm](https://pnpm.io/) ≥ 10 (paketų valdyme **niekada** ne npm / yarn)
- Google Cloud projektas su OAuth 2.0 Client ID (Web application)

### 1. Klonavimas ir priklausomybės

```bash
git clone https://github.com/FDiskas/saskaitos.git
cd saskaitos
pnpm install
```

### 2. Google OAuth Client ID

1. Eik į [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Sukurk **OAuth 2.0 Client ID** tipo *Web application*.
3. Į **Authorized JavaScript origins** įdėk `http://localhost:5173` (dev) bei savo production URL.
4. Įjunk **Google Drive API** (Library → Drive API → Enable). Naudojamas `drive.file` scope.

### 3. Aplinkos kintamieji

Sukurk `.env.local` projekto šaknyje:

```dotenv
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
# Pasirinktinai: dev rėžimas be Google — visus duomenis laiko atmintyje
# VITE_USE_IN_MEMORY=1
```

### 4. Paleidimas

```bash
pnpm dev          # http://localhost:5173
pnpm test         # Vitest
pnpm typecheck    # tsc --noEmit
pnpm lint         # ESLint
pnpm build        # production bundle į dist/
```

### 5. Deploy

Bet kuris statinis hostingas — Vercel, Netlify, Cloudflare Pages, GitHub Pages, S3 + CloudFront. Po `pnpm build` gauni `dist/` aplanką. Į Google Cloud OAuth konfiguraciją būtinai įrašyk savo production origin.

## Resend (el. pašto siuntimas)

Aplikacija siunčia laiškus tiesiogiai per [Resend](https://resend.com) REST API iš naršyklės — be jokio backend'o proxy. API raktas saugomas `settings.json` faile Drive'e (ne localStorage).

Sąraše:

1. Susikurk Resend paskyrą ir gauk API raktą.
2. Atidaryk Nustatymai → El. paštas, įvesk raktą.
3. Sąskaitos siuntimas tampa aktyvus.

## Jars.lt integracija

Kuriant klientą galima vienu mygtuku užpildyti įmonės duomenis iš Lietuvos Registrų centro per [jars.lt](https://jars.lt) API. Reikia įvesti savo jars.lt API raktą Nustatymuose → Integracijos (nemokama kvota — 100 užklausų/mėn).

## Limitacijos / žinomi apribojimai

- **Vartotojas matomas tik sau.** Tai single-user įrankis (jūsų Drive — jūsų duomenys). Daugiavartotojiškumo (komandos) nėra.
- **`drive.file` scope.** Pirmą kartą prisijungus iš kitos naršyklės, esami `Saskaitos_App` failai matomi tik jeigu juos sukūrė tas pats OAuth Client ID. Tas pats Client ID = tie patys failai matomi visur.
- **Privačios įmonės kvotos.** Resend ir Jars.lt — naudoja paties vartotojo raktus, todėl mokestis priklauso nuo tų paslaugų.

## Įnašai (Contributing)

Pull request'ai laukiami. Prieš atveriant:

1. Įsitikink, kad `pnpm test`, `pnpm typecheck` ir `pnpm lint` praeina.
2. Laikykis [CLAUDE.md](./CLAUDE.md) projekto stiliaus (domain layer be I/O, value objects, optimistic updates).
3. Naujoms pure funkcijoms `lib/domain/` ir `lib/utils/` — co-located `.test.ts` (TDD).
4. Commit'ai konvenciniai, atsakymai PR diskusijose — lietuviškai arba angliškai.

## Licencija

MIT — žiūrėk [LICENSE](./LICENSE).

## Padėka

- [TanStack Query / Router](https://tanstack.com) — server state ir routing.
- [Shadcn UI](https://ui.shadcn.com) — komponentų pagrindas.
- [@react-pdf/renderer](https://react-pdf.org) — PDF generavimas naršyklėje.
- [Lucide](https://lucide.dev) — ikonos.
- [jars.lt](https://jars.lt) — Lietuvos įmonių registro paieška.
