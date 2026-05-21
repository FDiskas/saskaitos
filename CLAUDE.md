# Bendri principai

- Package manager: pnpm visada. Niekur npm ar yarn.
- Atsakymai į user'į: lietuviškai.

# TypeScript

- NEVER `any`. NEVER `unknown` cast'ai be Zod parse.
- Visi externi duomenys (Drive, Resend, localStorage) — per Zod schema.
- `noUncheckedIndexedAccess` turi būti įjungtas.

# Domain layer (`lib/domain/`)

- Raw primitives draudžiami domain konceptams. Naudok value objects: `Money`, `VatRate`, `InvoiceId`, `ClientId`, `InvoiceNumber`.
- Money skaičiavimai TIK per `Money` klasę. Niekur `+ - * /` su number'iais, kurie reiškia pinigus.
- Visi value objects ir entities — immutable. Mutating metodai grąžina naują instance (`withFoo()`, ne `setFoo()`).
- Domain klasė NEGALI import'inti iš React, fetch, window, `lib/drive`, `lib/storage`. Tik TypeScript + Zod (schemoms tik).
- First-class collections: `LineItems`, ne `LineItem[]`. Komponentai dirba per kolekcijos metodus.

# Architektūra

- DIP: hooks priklauso nuo `Storage` interface, ne nuo `DriveClient` ar `DriveStorage`. Production wires `DriveStorage`, testai — `InMemoryStorage`.
- SRP: kiekvienas modulis, klasė, hook turi vieną atsakomybę. Jei pavadinimas turi "And" arba "Manager" — skaidyk.
- Decorator pattern HTTP layer'iui: `AuthInterceptor` / `TokenRefreshRetry` / `BackoffRetry` — kiekvienas atsakingas už vieną dalyką.
- Hooks po vieną atsakomybę: `useInvoice`, `useInvoiceList`, `useInvoiceMutations`, `useInvoiceStatus` — NEJUNGTI į `useInvoices`.

# Komponentai

- < 200 eilučių. Jei daugiau — extract.
- < 10 eilučių per metodą/funkciją.
- Tell-Don't-Ask: komponentai kviečia entity metodus (`invoice.totals()`), ne skaičiuoja patys.
- Drive mutacijos TIK per `hooks/use*`. Komponentai NEKVIETA storage tiesiai.
- Vengti `else` — early return.
- Niekur object lookup per `key in obj` ant untrusted strings — `Object.hasOwn(obj, key)`.

# TDD

- Kiekviena pure funkcija `lib/domain/` ir `lib/utils/` — co-located `.test.ts`.
- Red-Green-Refactor. Nerašyk production kodo be raudonos test'os.
- Test pavadinimai: "when X, then Y" (konkretūs, ne abstraktūs).

# Patterns

- Optimistic updates VISOMS mutacijoms — UI niekada nelaukia tinklo.
- TanStack Query keys — konstantos `src/query-keys.ts`.
- Tailwind v4: `@theme inline` custom properties, ne `tailwind.config.ts`.
- `syncQueue` — visos Drive mutacijos eina sequential, kad nesusikirstų lygiagrečios atnaujinimus į tą patį JSON.

# YAGNI / Rule of Three

- Nestatyk abstrakcijų prieš trečią duplikaciją.
- Nerašyk kodo "ateičiai" jei dabar nereikia.
- Šalink dead code iškart, ne komentuok.
