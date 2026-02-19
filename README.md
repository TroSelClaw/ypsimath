# YpsiMath

**YpsiMath** er en prototype på en AI-støttet læringsplattform for matematikk i norsk videregående skole.

Repoet er publisert som et **teknisk case** som dokumenterer helhetlig leveranseevne: produktforståelse, programvareutvikling, AI-integrasjon, sikkerhet, test og drift.

## TL;DR for recruiter

- Leverer en **fullstack AI-applikasjon** fra idé til driftbar løsning
- Bygger med **sikkerhets- og kontrollprinsipper** (RBAC, RLS, validering, sporbarhet)
- Viser **produksjonsdisiplin** med test, observability og dokumentasjon
- Demonstrerer **praktisk KI-utvikling** i et domene med høye krav til kvalitet

---

## Formål

YpsiMath er bygget for å adressere tre konkrete behov i matematikkundervisning:

- mer **tilpasset læring** for elever med ulike nivå og tempo
- lavere **operativ belastning** for lærer
- bedre **sporbarhet og kvalitet** i digital læringsflyt

---

## Funksjonalitet (implementert)

> Dette er en fungerende applikasjon, ikke et oppstarts-skjelett.

### Elevfunksjoner
- Wiki med matematikkinnhold (Markdown + KaTeX)
- Chat med streaming og RAG-basert kontekst
- Flashcards med SM-2 spaced repetition
- Fremgangsvisning på kompetansemål
- Øvingsprøver og oppgavesjekk (selvrapportering, auto-check, bildeanalyse)

### Lærer-/adminfunksjoner
- Klasseoversikt og elevdetaljer
- Prøvegenerering og PDF-eksport
- Opplasting av besvarelser med AI-assistert analyse
- Innholdsreview med statusflyt (draft/flagged/reviewed/published)
- Brukeradministrasjon med roller og audit-orientert flyt

### Kvalitet og drift
- Rollebasert tilgangskontroll
- RLS i Supabase
- E2E- og enhetstester (Playwright/Vitest)
- Sentry + Vercel Analytics
- Dokumentasjon for sikkerhet, personvern, observability og testing

---

## Teknologistakk

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind, shadcn/ui
- **Backend/BaaS:** Supabase (Postgres, Auth, Storage, pgvector)
- **AI-lag:** AI SDK + modeller for chat, retrieval, analyse og innholdsflyt
- **Math UX:** KaTeX, Mafs, GeoGebra-embed, Pyodide
- **Testing:** Vitest + Playwright
- **Observability:** Sentry, Vercel Analytics

Se også: [`docs/architecture.md`](docs/architecture.md)

---

## Relevans for KI-utvikling i sikkerhetskritisk miljø

Prosjektet demonstrerer arbeidsmåter som er overførbare til miljøer med høye krav til kvalitet og kontroll:

- **Datadisiplin:** tydelig modellering av domeneobjekter og tilgangsnivå
- **Tilgangsstyring:** rollebasert struktur i applikasjon + RLS i datalag
- **Sporbarhet:** dokumenterte flyter, testoppsett og operasjonell logging
- **Kontrollert AI-bruk:** AI som beslutningsstøtte, ikke uverifisert autonom beslutningstaker
- **Robusthet:** validering, feilhåndtering og testbarhet som standard
- **Prompt-sikkerhet:** modellinteraksjoner designes med validering og begrenset tilgang for å redusere risiko for manipulert input (prompt injection)

---

## Arkitektur i én setning

YpsiMath bruker en role-first Next.js-arkitektur over Supabase med hybrid RAG (vektor + fulltekst + rank-fusjon), der elev- og lærerfunksjoner er separert i tydelige domener med felles sikkerhets- og datamodell.

---

## Lokal kjøring

### 1) Installer avhengigheter

```bash
pnpm install
```

### 2) Konfigurer miljøvariabler

```bash
cp .env.local.example .env.local
```

Fyll inn nødvendige nøkler (Supabase, AI-provider(e), observability).

### 3) Start applikasjonen

```bash
pnpm dev
```

Åpne: http://localhost:3000

---

## Tester

```bash
# Typecheck
pnpm -s tsc --noEmit

# Unit/integration
pnpm vitest run

# End-to-end
pnpm test:e2e
```

---

## Struktur (hurtigoversikt)

```text
src/
  app/
    (auth)/
    (student)/
    (teacher)/
    (admin)/
    api/
  components/
  lib/
    rag/
    generation/
    supabase/
    schemas/

docs/
  architecture.md
  testing-guide.md
  observability.md
  gdpr-checklist.md
  security-checklist.md
```

---

## Videre arbeid

- Feide/SSO-integrasjon
- Videre fagdekning (R2/1T/1P/2P)
- Videreutviklet kost-/modellrouting i AI-laget
- Utvidet måling av læringseffekt

---

## Authorship

Developed and maintained by Aleksander Trovum Seland.
Built using OpenClaw as development environment and workflow orchestration tool.

---

## Lisens

Legg inn ønsket lisens (f.eks. MIT) før ekstern gjenbruk.
