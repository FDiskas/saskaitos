---
name: in-picker-client-creation
description: NewInvoicePicker inline "Create client" dialog flow
keywords: client, picker, invoice, dialog, inline, create
---

`NewInvoicePicker` (rodomas kai `/invoice-editor/new`) turi mygtuką `Sukurti naują klientą`, kuris atveria `ClientFormDialog` modalą be išėjimo iš sąskaitos kūrimo flow.

**Why:** Sąskaitą dažnai išrašoma naujam klientui — anksčiau reikėjo eiti į `/clients`, sukurti, grįžti. Dabar single-flow be konteksto praradimo.

**How it works:**
- Naujas klientas sukuriamas per `useCreateClient` mutaciją; `onMutate` synchroniškai įkelia į `useClients` cache (optimistic update).
- Po `createClient.mutate(created)` iškart kviečiamas `onClientSelected(created.id)` — sąskaitos kūrimas tęsiasi.
- Drive įrašai serializuojami per `syncQueue` — klientas suspėja įsirašyti į Drive prieš invoice mutaciją.
- `clientFromForm()` helper'is `NewInvoicePicker.tsx` faile dubliuoja `Client.of(...)` shape iš `routes/clients.tsx`. Tai 2-as panaudojimas (Rule of Three) — extract'inti reikia tik trečiajam.
