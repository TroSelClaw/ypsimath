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
| TASK-023 | Admin content review dashboard | ✅ | 2026-02-18 | 2026-02-18 | Filters + approve/edit/publish + bulk publish reviewed |
| TASK-024 | Wiki renderer: teori/regler/eksempler | ✅ | 2026-02-18 | 2026-02-18 | SSR route + blokker + breadcrumbs + neste/forrige |
| TASK-025 | Wiki øvelser: selvrapport + autosjekk | ✅ | 2026-02-18 | 2026-02-18 | ExerciseBlock + hints/fasit/selvrapport + server action + auto-check tester |
| TASK-026 | Pyodide Python runtime | ✅ | 2026-02-18 | 2026-02-18 | Pyodide lazy-load + PythonRunner + matplotlib plot-støtte |
| TASK-027 | Mafs interaktive viz | ✅ | 2026-02-18 | 2026-02-18 | FunctionPlot + TangentExplorer + AreaUnderCurve + VectorPlot + ParametricPlot |
| TASK-028 | GeoGebra embed | ✅ | 2026-02-18 | 2026-02-18 | Sandboxed iframe + lazy-load med IntersectionObserver + fallback-lenke |
| TASK-029 | Planet journey (lineær) | ✅ | 2026-02-18 | 2026-02-18 | PlanetMap + PlanetNode på /fremgang med progresjonsstatus, planlagt dato og navigering til wiki-tema |
| TASK-030 | Semesterplan: wizard | ✅ | 2026-02-18 | 2026-02-18 | P1 |
| TASK-031 | Semesterplan: kalender + DnD | ✅ | 2026-02-18 | 2026-02-18 | Kalender-/tabellvisning, drag-and-drop mellom datoer, chat-redigering, auto-save (2s) og versjonslagring |
| TASK-032 | Semesterplan: elevvisning | ✅ | 2026-02-18 | 2026-02-18 | /fremgang viser neste tema+dato, planetetiketter med dato og statusbanner (i rute/foran/bak) basert på mastered_competency_goals |
| TASK-033 | Aktivitetslogging | ✅ | 2026-02-18 | 2026-02-18 | Ny logActivity action + tracker, wiki view start/end med beacon, oppdatering av studentprofilaggregater |
| TASK-034 | Bildeopplasting øvelser | ✅ | 2026-02-18 | 2026-02-18 | /api/exercise/image-check + Supabase upload + Gemini-feedback + UI i ExerciseBlock |
| TASK-035 | Wiki-søk | ✅ | 2026-02-18 | 2026-02-18 | Cmd+K dialog, FTS RPC, grouped results |
| TASK-036 | Phase 1 integrasjonstest | ✅ | 2026-02-18 | 2026-02-18 | Playwright config + wiki/admin E2E specs (env-seeded) |

## Phase 2 — Chat-tutor + Elevprofil (4–6 uker)

| Task | Navn | Status | Startet | Ferdig | Notater |
|------|------|--------|---------|--------|---------|
| TASK-037 | Hybrid RAG engine | ✅ | 2026-02-18 | 2026-02-18 | RRF k=60, vector+FTS, subject boost |
| TASK-038 | Chat API (streaming + RAG) | ✅ | 2026-02-18 | 2026-02-18 | Gemini Flash + RAG + rate limit |
| TASK-039 | Chat UI (streaming + KaTeX) | ✅ | 2026-02-18 | 2026-02-18 | AI SDK v6 + MathContent + conversation sidebar |
| TASK-040 | Chat bildeopplasting | ✅ | 2026-02-18 | 2026-02-18 | Kamera-attach i chat composer, Supabase upload + signed thumbnail, API bildeanalyse med Gemini-kontekst + image rate limit |
| TASK-041 | Elevprofil + mål | ✅ | 2026-02-18 | 2026-02-18 | /profil med elevinfo, kompetansegrid, statistikk + server action for mål (target_grade/focus_areas) |
| TASK-042 | AI studieanbefalinger | ✅ | 2026-02-18 | 2026-02-18 | Profilside med AI-anbefalinger, 24t cache, tvungen oppdatering (1/time), lenker til wiki-tema |
| TASK-043 | Tverrfaglig differensiering | ✅ | 2026-02-18 | 2026-02-18 | Kryssfaglig RAG-konfig med R2/1T/1P-boost + promptvern mot nivå-avsløring + Vitest |
| TASK-044 | Samtalehistorikk | ✅ | 2026-02-19 | 2026-02-19 | Soft-delete + rename + søk i sidebar |
| TASK-045 | Phase 2 integrasjonstest | ✅ | 2026-02-19 | 2026-02-19 | chat.spec.ts + profile.spec.ts |

## Phase 3 — Prøver og vurdering (4–6 uker)

| Task | Navn | Status | Startet | Ferdig | Notater |
|------|------|--------|---------|--------|---------|
| TASK-046 | Prøvegenerering: skjema | ✅ | 2026-02-19 | 2026-02-19 | Form + Zod-validering |
| TASK-047 | Prøvegenerering: AI API | ✅ | 2026-02-19 | 2026-02-19 | GPT-4o + RAG + Zod-validering |
| TASK-048 | Prøve: preview + redigering | ✅ | 2026-02-19 | 2026-02-19 | Inline editor + KaTeX preview + auto-save |
| TASK-049 | PDF-eksport (Puppeteer) | ✅ | 2026-02-19 | 2026-02-19 | Puppeteer + Supabase Storage + HTML fallback |
| TASK-050 | Skanning: PDF-opplasting | ✅ | 2026-02-19 | 2026-02-19 | PDF-upload + sideintervaller + start retting |
| TASK-051 | AI-retting + feilanalyse | ✅ | 2026-02-19 | 2026-02-19 | Gemini OCR + GPT-4o scoring + feilkategorisering |
| TASK-052 | Resultatvisning | ✅ | 2026-02-19 | 2026-02-19 | Klasseoversikt + detaljvisning + overstyring + CSV + Realtime-refresh |
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
