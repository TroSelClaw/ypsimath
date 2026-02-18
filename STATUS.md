# YpsiMath — Task Status Tracker

> Oppdateres fortløpende. Én rad per task.

## Statusnøkler
- ⬜ Ikke startet
- 🔧 Under arbeid
- ✅ Ferdig
- ⏸️ Pauset
- ❌ Droppet/utsatt

## Phase 0 — Foundation (4–6 uker)

| Task | Navn | Status | Startet | Ferdig | Notater |
|------|------|--------|---------|--------|---------|
| TASK-001 | Next.js 15 scaffold | ✅ | 2026-02-18 | 2026-02-18 | Next.js 16.1.6, TS 5.9.3, pnpm |
| TASK-002 | Tailwind + shadcn/ui | ✅ | 2026-02-18 | 2026-02-18 | dark/light/UU, shadcn neutral |
| TASK-003 | Supabase EU Frankfurt | ✅ | 2026-02-18 | 2026-02-18 | eu-west-1 (Ireland), 3 buckets, pgvector |
| TASK-004 | DB: user/class tables | ✅ | 2026-02-18 | 2026-02-18 | RLS + trigger |
| TASK-005 | DB: content tables | ✅ | 2026-02-18 | 2026-02-18 | pgvector HNSW + FTS GIN + R1 seed |
| TASK-006 | DB: activity/exam/chat/semester | ✅ | 2026-02-18 | 2026-02-18 | 13 tabeller + RLS |
| TASK-007 | Auth: registrering + login | ✅ | 2026-02-18 | 2026-02-18 | Server actions + Zod + norske feilmeldinger |
| TASK-008 | Auth: middleware + logout | ✅ | 2026-02-18 | 2026-02-18 | Middleware + route protection + ?next param |
| TASK-009 | Rollebasert routing + layouts | ✅ | 2026-02-18 | 2026-02-18 | Student/teacher/admin layouts + requireRole |
| TASK-010 | Klasse-/elevadmin UI | ✅ | 2026-02-18 | 2026-02-18 | Opprett klasse + legg til elev |
| TASK-011 | Typografi + KaTeX fonts | ✅ | 2026-02-18 | 2026-02-18 | Inter + KaTeX + nb-NO formatters |
| TASK-012 | KaTeX + Markdown pipeline | ✅ | 2026-02-18 | 2026-02-18 | 6 tester grønne |
| TASK-013 | CI/CD: GitHub Actions + Vercel | ✅ | 2026-02-18 | 2026-02-18 | Vercel auto-deploy settes opp når GitHub-repo opprettes |
| TASK-014 | Responsiv app-shell + nav | ✅ | 2026-02-18 | 2026-02-18 | Desktop sidebar + mobile bottom-nav + theme toggle |
| TASK-015 | Rate limiting | ✅ | 2026-02-18 | 2026-02-18 | In-memory sliding window, 2 tester |
| TASK-016 | Feilhåndtering + logging | ✅ | 2026-02-18 | 2026-02-18 | Sentry legges til i Phase 6 |
| TASK-017 | Zod-skjemaer | ✅ | 2026-02-18 | 2026-02-18 | Zod v4, 4 tester, alle modeller |
| TASK-018 | Phase 0 smoke test | ✅ | 2026-02-18 | 2026-02-18 | Lint 0 errors, 12 tests pass, build OK |

## Phase 1 — Content Pipeline + Wiki (6–8 uker)

| Task | Navn | Status | Startet | Ferdig | Notater |
|------|------|--------|---------|--------|---------|
| TASK-019 | Source RAG DB | ✅ | 2026-02-18 | 2026-02-18 | Migration + chunker + embedder + script |
| TASK-020 | Content generation script | ✅ | 2026-02-18 | 2026-02-18 | Claude + RAG + KaTeX validation |
| TASK-021 | Embedding pipeline | ✅ | 2026-02-18 | 2026-02-18 | Batch + retry + idempotent |
| TASK-022 | LLM quality flagging | ✅ | 2026-02-18 | 2026-02-18 | Sonnet quality pass + metadata flag_reason/confidence |
| TASK-023 | Admin content review dashboard | ⬜ | — | — | |
| TASK-024 | Wiki renderer: teori/regler/eksempler | ⬜ | — | — | |
| TASK-025 | Wiki øvelser: selvrapport + autosjekk | ⬜ | — | — | |
| TASK-026 | Pyodide Python runtime | ⬜ | — | — | P1 |
| TASK-027 | Mafs interaktive viz | ⬜ | — | — | P1 |
| TASK-028 | GeoGebra embed | ⬜ | — | — | P2 |
| TASK-029 | Planet journey (lineær) | ⬜ | — | — | P1 |
| TASK-030 | Semesterplan: wizard | ⬜ | — | — | P1 |
| TASK-031 | Semesterplan: kalender + DnD | ⬜ | — | — | P1 |
| TASK-032 | Semesterplan: elevvisning | ⬜ | — | — | P1 |
| TASK-033 | Aktivitetslogging | ⬜ | — | — | |
| TASK-034 | Bildeopplasting øvelser | ⬜ | — | — | P1 |
| TASK-035 | Wiki-søk | ⬜ | — | — | P2 |
| TASK-036 | Phase 1 integrasjonstest | ⬜ | — | — | |

## Phase 2 — Chat-tutor + Elevprofil (4–6 uker)

| Task | Navn | Status | Startet | Ferdig | Notater |
|------|------|--------|---------|--------|---------|
| TASK-037 | Hybrid RAG engine | ⬜ | — | — | |
| TASK-038 | Chat API (streaming + RAG) | ⬜ | — | — | |
| TASK-039 | Chat UI (streaming + KaTeX) | ⬜ | — | — | |
| TASK-040 | Chat bildeopplasting | ⬜ | — | — | P1 |
| TASK-041 | Elevprofil + mål | ⬜ | — | — | P1 |
| TASK-042 | AI studieanbefalinger | ⬜ | — | — | P2 |
| TASK-043 | Tverrfaglig differensiering | ⬜ | — | — | P2 |
| TASK-044 | Samtalehistorikk | ⬜ | — | — | P1 |
| TASK-045 | Phase 2 integrasjonstest | ⬜ | — | — | |

## Phase 3 — Prøver og vurdering (4–6 uker)

| Task | Navn | Status | Startet | Ferdig | Notater |
|------|------|--------|---------|--------|---------|
| TASK-046 | Prøvegenerering: skjema | ⬜ | — | — | |
| TASK-047 | Prøvegenerering: AI API | ⬜ | — | — | |
| TASK-048 | Prøve: preview + redigering | ⬜ | — | — | |
| TASK-049 | PDF-eksport (Puppeteer) | ⬜ | — | — | |
| TASK-050 | Skanning: PDF-opplasting | ⬜ | — | — | |
| TASK-051 | AI-retting + feilanalyse | ⬜ | — | — | |
| TASK-052 | Resultatvisning | ⬜ | — | — | |
| TASK-053 | Elevgenererte øvingsprøver | ⬜ | — | — | P2 |
| TASK-054 | Phase 3 integrasjonstest | ⬜ | — | — | |

## Phase 4 — Lærer-dashboard + rapporter (3–4 uker)

| Task | Navn | Status | Startet | Ferdig | Notater |
|------|------|--------|---------|--------|---------|
| TASK-055 | Klasseoversikt + heatmap | ⬜ | — | — | |
| TASK-056 | Per-elev detaljvisning | ⬜ | — | — | |
| TASK-057 | AI vurderingsrapport | ⬜ | — | — | |
| TASK-058 | Prøveadmin panel | ⬜ | — | — | |
| TASK-059 | Content review workflow | ⬜ | — | — | |
| TASK-060 | Semesterplan dashboard-widget | ⬜ | — | — | |
| TASK-061 | Brukeradmin (admin) | ⬜ | — | — | |
| TASK-062 | Phase 4 integrasjonstest | ⬜ | — | — | |

## Phase 5 — Flashcards + Video (3–4 uker)

| Task | Navn | Status | Startet | Ferdig | Notater |
|------|------|--------|---------|--------|---------|
| TASK-063 | Flashcard-generering | ⬜ | — | — | P2 |
| TASK-064 | Flashcard UI + SM-2 | ⬜ | — | — | P2 |
| TASK-065 | Mobil-flashcard layout | ⬜ | — | — | P2 |
| TASK-066 | Manim script-generering | ⬜ | — | — | P2 |
| TASK-067 | Manim rendering + CDN | ⬜ | — | — | P2 |
| TASK-068 | Video i wiki | ⬜ | — | — | P2 |
| TASK-069 | Phase 5 integrasjonstest | ⬜ | — | — | P2 |

## Phase 6 — Polish + Launch (2–3 uker)

| Task | Navn | Status | Startet | Ferdig | Notater |
|------|------|--------|---------|--------|---------|
| TASK-070 | Lighthouse audit | ⬜ | — | — | |
| TASK-071 | WCAG 2.1 AA audit | ⬜ | — | — | |
| TASK-072 | GDPR: DPIA + personvern | ⬜ | — | — | P0 |
| TASK-073 | Sikkerhetsharding | ⬜ | — | — | |
| TASK-074 | Feilovervåking + observability | ⬜ | — | — | |
| TASK-075 | Brukertesting | ⬜ | — | — | |
| TASK-076 | Produksjonslansering | ⬜ | — | — | P0 |
| TASK-077 | Dokumentasjon | ⬜ | — | — | P2 |
| TASK-078 | Regresjonstest | ⬜ | — | — | P0 |
