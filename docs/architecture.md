# Architecture — YpsiMath

Kort teknisk oversikt over systemdesign, sikkerhetsgrep og sentrale trade-offs.

---

## 1) Designmål

Arkitekturen er bygget for å balansere:

1. **Pedagogisk funksjon** (elev og lærer)
2. **Praktisk AI-bruk i produksjon**
3. **Kontroll, sikkerhet og driftbarhet**

---

## 2) Høynivå

```text
Client (Next.js UI)
   |
   v
Next.js App Router (SSR/RSC + Route Handlers + Server Actions)
   |
   +--> Supabase (Postgres + pgvector + Auth + Storage)
   |
   +--> AI Layer (chat, retrieval, content/exam workflows)
   |
   +--> Observability (Sentry, analytics)
```

Løsningen er implementert som én modulær applikasjon med tydelig domeneseparasjon.

---

## 3) Applikasjonslag

### 3.1 Rutesegmentering

- `(auth)` → autentisering
- `(student)` → wiki, chat, fremgang, flashcards, øvingsprøver
- `(teacher)` → klasse-/elev-/prøvearbeid
- `(admin)` → innholds- og brukerforvaltning

Dette reduserer rolleblanding og gjør policy enklere å verifisere.

### 3.2 API og server actions

- `src/app/api/*` for route handlers
- `src/app/actions/*` for servermutasjoner
- Zod brukes systematisk for inputvalidering

---

## 4) Datalag (Supabase)

Supabase brukes for:

- Postgres (forretningsdata)
- `pgvector` (embedding/retrieval)
- Auth (identitet/roller)
- Storage (bilder, filer, PDF)

### Sikkerhetsmodell

- RLS på elev- og brukerrelaterte tabeller
- Tilgang basert på rolle og relasjon (eier, lærer, klassemedlemskap)
- API-lag med autentiseringskrav i tillegg til databasepolicy

---

## 5) AI-arkitektur

### 5.1 Retrieval-strategi

Hybrid RAG:

1. vektorsøk (semantisk relevans)
2. fulltekstsøk (presisjon)
3. rank-fusjon (stabil slutt-rangering)

Dette gir mer robuste svar enn én enkelt retrieval-metode.

### 5.2 AI-flyter

- elevchat med pensumkontekst
- innholdsstøtte i adminflyt
- prøvegenerering og analyse
- bildeanalyse av oppgavebesvarelser

Designprinsipp: AI er plassert i domeneorienterte moduler (`src/lib/*`) og ikke tett koblet til presentasjonslaget.

---

## 6) Frontend og læringsopplevelse

- Markdown + KaTeX for matematisk innhold
- Interaktive komponenter (Mafs/GeoGebra/Pyodide)
- Streaming chat for responsiv brukeropplevelse
- Mobiltilpasset flashcard-flyt

---

## 7) Kvalitet og operasjonell modenhet

- Vitest for enhet/integrasjon
- Playwright for E2E
- Sentry for feilsporing
- Dokumenterte sjekklister for sikkerhet/personvern/observability

Mål: gjøre systemet revisjonsvennlig, testbart og videreutviklingsbart.

---

## 8) Sikkerhets- og kontrollprinsipper

Følgende prinsipper ligger til grunn i løsningen:

- **Least privilege:** tilgang gis per rolle og behov
- **Defense in depth:** policy i både applikasjonslag og datalag
- **Fail closed:** ugyldige kall stoppes tidlig via autentisering/validering
- **Traceability:** hendelser og feil skal kunne spores
- **Human in the loop:** AI støtter beslutninger, men erstatter ikke faglig ansvarlig

---

## 9) Viktige trade-offs

1. **Modulær monolitt fremfor mikrotjenester**
   - høyere leveringstakt i tidlig fase
2. **Supabase som plattformvalg**
   - rask utvikling, men sterk leverandørkobling
3. **Hybrid retrieval fremfor enkel retrieval**
   - mer kompleksitet, bedre kvalitet
4. **AI-assistert vurdering fremfor automatisk karaktersetting**
   - bevarer ansvar hos lærer

---

## 10) Neste arkitekturtrinn

- Feide/SSO og sterkere organisasjonsmodell
- Jobbkø for tunge asynkrone AI-/PDF-jobber
- Mer finmasket policy-lag for multi-school tenancy
- Bedre evalueringsramme for modellkvalitet/kost

---

Se `PRD.md` for full produktkontekst og funksjonelt omfang.
