# YpsiMath — Beslutningslogg & Erfaringer

> Kronologisk logg over alle avgjørelser, erfaringer og lærdommer underveis.
> Skrives til fortløpende av Clawdia. Hver entry har dato, kontekst og begrunnelse.

---

## 2026-02-18 — Prosjektoppstart

### Beslutning: Prosjektstruktur
- **Valg:** `projects/ypsimath/` med `PRD.md`, `TASKS.md`, `STATUS.md`, `DECISIONS.md`
- **Begrunnelse:** Holder alt prosjektrelatert samlet. `STATUS.md` gir rask oversikt over fremdrift. `DECISIONS.md` (denne filen) er den fullstendige loggen Aleksander ba om.
- **Alternativ vurdert:** Bruke GitHub Issues for task-tracking → droppet fordi STATUS.md er enklere å vedlikeholde i vår arbeidsflyt og gir bedre oversikt i én fil.

### Beslutning: Git-repo i prosjektmappen
- **Valg:** Initialiserte git-repo direkte i `projects/ypsimath/`
- **Begrunnelse:** Følger workspace-regelen om at `projects/` er sync-område mot GitHub. Klar for remote når GitHub-repo opprettes.

---

### Beslutning: Git beste praksiser
- **Valg:** Følger disse reglene gjennom hele prosjektet:
  - **Conventional Commits**: `type(scope): beskrivelse` — imperative mood, lowercase, ingen punktum
  - **Scope = TASK-ID** når relevant: `feat(TASK-001): scaffold next.js 15 project`
  - **Én logisk endring per commit** — ikke samle urelaterte endringer
  - **Feature branches**: `feat/TASK-XXX-kort-beskrivelse` for hver task, merges til `main`
  - **Ikke commit secrets** — `.env` i `.gitignore` fra dag 1
  - **Meningsfulle meldinger**: body forklarer *hvorfor*, ikke *hva*
- **Begrunnelse:** Gir lesbar historikk, muliggjør automatisk changelog, og holder `main` stabil.

---

## 2026-02-18 — TASK-001: Next.js scaffold

### Erfaring: create-next-app i ikke-tom mappe
- Scaffoldet til `/tmp/` og kopierte tilbake — `create-next-app` nekter å kjøre i mapper med eksisterende filer.
- Første forsøk mistet dotfiles pga `sh` (ikke bash) — `mv *` inkluderer ikke dotfiles. Løst med `find -exec cp`.
- **Lærdom:** Alltid scaffold til tmp og bruk `find . -maxdepth 1 -not -name '.' -not -name '.git' -exec cp -r {} dest/ \;` for å flytte inkl. dotfiles.

### Beslutning: Next.js 16.1.6 (ikke 15)
- `create-next-app@latest` ga Next.js 16.1.6 (ikke 15 som i PRD). PRD sier "Next.js 15" men dette er nyere og bakoverkompatibelt. Beholder 16.x.
- TypeScript 5.9.3, React 19.2.3, Tailwind 4.1.18.

### Beslutning: Prettier config
- Semi: false, singleQuote: true, trailingComma: all — standard for moderne Next.js-prosjekter.
- Lagt til `prettier-plugin-tailwindcss` for automatisk sortering av klasser.

---

## 2026-02-18 — TASK-002 til TASK-017: Fase 0 kjernearbeid

### Beslutning: shadcn/ui v4 init
- shadcn@latest endret CLI — `--style` flagget er fjernet. Brukte interaktiv modus med Neutral base.
- UU-modus implementert som egen CSS-klasse `.uu` med 18px base font og max kontrast.

### Beslutning: Zod v4
- `pnpm add zod` ga Zod 4.3.6. Import endret til `zod/v4`.
- `z.record()` krever nå to argumenter (key, value). Fikset i alle skjemaer.

### Beslutning: Next.js 16 (ikke 15)
- `create-next-app@latest` installerte Next.js 16.1.6 (nyeste). PRD sier 15, men 16 er bakoverkompatibelt og nyere. Beholder.

### Erfaring: rehype-katex type-feil
- `rehype-katex` aksepterer ikke `output: 'html'` i sin TypeScript-type. Løst med type assertion.

### Blokkering: Supabase-prosjekt
- TASK-003 klientkode er klar, men trenger Aleksanders Supabase-konto for å opprette prosjektet i EU Frankfurt.
- TASK-004/005/006 (DB-migrasjoner) er blokkert av dette.
- TASK-007/008/009 (auth + routing) er blokkert av DB.

---

## 2026-02-18 — TASK-014: Responsiv app-shell + navigasjon

### Beslutning: Arkitektur for app-shell
- **Valg:** Desktop sidebar (sticky, 240px) + mobile header med Sheet-meny + bottom tab-nav
- **Begrunnelse:** Standard mønster for responsiv dashboard-app. Bottom-nav gir tommelvenlig navigasjon på mobil. Sheet-meny gir tilgang til alle nav-items inkl. innstillinger.
- **Alternativ vurdert:** shadcn Sidebar-komponentens innebygde collapsible → for kompleks for nåværende behov, bruker enklere tilnærming.

### Beslutning: Tema-syklus (light → dark → UU)
- **Valg:** Én knapp som syklerer gjennom tre moduser
- **Begrunnelse:** Enklere UX enn dropdown. UU-modus (høy kontrast) var allerede definert i TASK-002.

### Erfaring: React 19 lint-regler
- `useEffect(() => setState(true), [])` gir lint-feil i React 19 (`react-hooks/set-state-in-effect`). Løst med `requestAnimationFrame` wrapper.
- shadcn sidebar skeleton bruker `Math.random()` i render — gir `react-hooks/purity`-feil. Erstattet med fast bredde.

---

## 2026-02-18 — TASK-018: Phase 0 smoke test

### Resultat: Alt grønt
- Lint: 0 errors, 0 warnings
- Tests: 12/12 pass (markdown pipeline 6, schemas 4, rate-limit 2)
- Build: Kompilerer og genererer statiske sider uten feil
- **Konklusjon:** Phase 0 foundation er stabil for videre arbeid.

---

## 2026-02-18 — TASK-019: Source RAG DB

### Beslutning: Egen `src_chunks`-tabell med streng RLS
- **Valg:** Opprettet `src_chunks` (internal source-RAG) med `UNIQUE (source_file, chunk_index)` for idempotent ingest.
- **Begrunnelse:** Sikrer at script kan kjøres flere ganger uten duplikater, og at tabellen aldri eksponeres for vanlige JWT-er.
- **Teknisk:** HNSW cosine-index på `embedding VECTOR(1536)`, ingen read-policies (kun service role via RLS-bypass).

### Beslutning: Enkel, robust chunking først
- **Valg:** Implementerte paragraf-bevisst overlap-chunker (500/100 tokens approx) med ord-baserte heuristikker.
- **Begrunnelse:** God nok kvalitet i MVP, lav kompleksitet, enkel å teste.
- **Lærdom:** Overlap-tester må sjekke glidende delmengder, ikke faste siste/første 10 ord.

## 2026-02-18 — TASK-020: Content generation script

### Beslutning: Strukturert prompt-pipeline med R1-mål innebygd
- **Valg:** Egen `prompts.ts` + `content-generator.ts` med JSON-outputkrav og KaTeX-regelsjekk.
- **Begrunnelse:** Forutsigbar output gjør lagring i `content_elements` enklere og reduserer manuell opprydding.
- **Teknisk:** `--dry-run` støttes for sikker verifisering før DB-innsetting.

## 2026-02-18 — TASK-021: Embedding pipeline

### Beslutning: Batch + retry + idempotens
- **Valg:** `embed-content.ts` prosesserer kun `embedding IS NULL` for `reviewed/published`, med batch-size default 50 og 3 retries.
- **Begrunnelse:** Stabil drift ved midlertidige API-feil, minimal risiko for dobbeltarbeid.
- **Merk:** Atomic oppdatering av `embedding + fts` krever DB-side trigger/RPC senere; nå oppdateres embedding i script-lag.

## 2026-02-18 — TASK-022: LLM quality flagging

### Beslutning: Separat quality-pass før publisering
- **Valg:** `flag-content.ts` + `quality-checker.ts` (Sonnet) som flytter `draft -> reviewed/flagged` og lagrer `flag_reason` + `flag_confidence` i metadata.
- **Begrunnelse:** Tydelig kvalitetsgate før admin-review reduserer støy i dashboardet.
- **Lærdom:** Egen parser (`parseQualityResponse`) gjør responshåndtering testbar uten API-kall.

## 2026-02-18 — TASK-023: Admin content review dashboard

### Beslutning: Leverte MVP-dashboard med server actions først
- **Valg:** Implementerte `/admin/innhold` med filtrering, status-badges, inline redigering og bulk-publisering av `reviewed`.
- **Begrunnelse:** Dekker den viktigste arbeidsflyten raskt (triage → edit → publish), uten å blokkere videre tasks.
- **Teknisk:** Egen `app/actions/content.ts` for statusbytte, versjonering (`content_versions`) før overskriving, og publiseringsknapp.

### Avgrensning i denne iterasjonen
- Side-by-side visning mot source-RAG-kontekst er ikke fullført i denne committen.
- Pagination er implementert via `range` + page-parameter, men uten dedikert sidekontroll-komponent.

## 2026-02-18 — TASK-024: Wiki renderer (theory/rule/example)

### Beslutning: SSR-først for wiki-temaside
- **Valg:** Implementerte `/wiki/[subject]/[topic]` som Server Component med sortering på `sort_order` og `status='published'`.
- **Begrunnelse:** Gir stabil rendering av matteinnhold server-side og matcher krav om SSR i PRD.

### Beslutning: Enkle, tydelige blokkkomponenter
- **Valg:** Delte rendering i `TheoryBlock`, `RuleBlock`, `ExampleBlock`.
- **Begrunnelse:** Lav kobling og enkel videreutvikling når exercises/exploration kommer i neste tasks.
- **Merk:** Eksempler bruker `<details>` for progressiv avsløring i denne iterasjonen.

## 2026-02-18 — TASK-025: Wiki øvelser (selvrapport + autosjekk)

### Beslutning: Klientdrevet oppgaveblokk med server actions for logging
- **Valg:** La `ExerciseBlock` håndtere interaksjonene i klienten (hint, autosjekk, fasit, selvrapport), og persistere forsøk via `recordExerciseAttempt` server action.
- **Begrunnelse:** Gir rask respons i UI samtidig som vi får robuste writes til `exercise_attempts` + `activity_log`.

### Beslutning: MVP-avgrensning på drag_drop/interaktive oppgaver
- **Valg:** `drag_drop` og `interactive` støttes i samme blokk, men valideres foreløpig via fasit + selvrapport (ikke full autosjekk i denne tasken).
- **Begrunnelse:** Holder scope riktig for TASK-025 uten å blokkere videre fasearbeid.

### Erfaring: Norsk tallformat i autosjekk
- **Lærdom:** Numeric autosjekk må normalisere både komma og punktum (`2,5` og `2.5`) for å unngå falske feil.

## 2026-02-18 — TASK-026: Pyodide Python runtime

### Beslutning: CDN-basert lazy-load av Pyodide
- **Valg:** Lastet Pyodide dynamisk fra jsDelivr ved første kjøring via `loadPyodideRuntime()`.
- **Begrunnelse:** Unngår å legge ~10MB runtime i initial bundle, holder wiki-sider raske når exploration-blokker ikke brukes.

### Beslutning: Enkel editor + stdout/stderr + matplotlib i MVP
- **Valg:** `PythonRunner` med textarea-editor, "Kjør kode"-knapp, stdout/stderr-visning og automatisk rendering av siste matplotlib-figur.
- **Begrunnelse:** Oppfyller kjernebehovet for interaktive utforskninger uten å dra inn tung editor-avhengighet i denne tasken.

### Sikkerhetsavgrensning i runtime
- **Valg:** Blokkerte `window.fetch` under kjøring av bruker-kode for å hindre nettverkskall fra Python-sandkassen.
- **Begrunnelse:** Reduserer risiko i klientkjøring og matcher kravet om isolert kjøring i nettleseren.

## 2026-02-18 — TASK-027: Mafs interaktive visualiseringer

### Beslutning: Egen visualiseringspakke med fire MVP-komponenter + parametrisk plot
- **Valg:** La til `components/visualizations/` med `FunctionPlot`, `TangentExplorer`, `AreaUnderCurve`, `VectorPlot` og `ParametricPlot` (eksportert via `index.ts`).
- **Begrunnelse:** Oppfyller PRD-kravene for R1-utforskning med gjenbrukbare byggesteiner som kan brukes direkte i kommende wiki-`exploration`-elementer.

### Beslutning: Numerisk arealberegning med trapezmetoden
- **Valg:** `AreaUnderCurve` bruker justerbare grenser og trapezintegrasjon for å vise estimert areal i sanntid.
- **Begrunnelse:** Robust og lettforklarlig MVP-løsning uten tunge symbolbiblioteker.

### Avgrensning i denne iterasjonen
- Pilhoder på vektorer er ikke lagt inn ennå (linjesegmenter + parallellogram brukes i MVP-visningen).
- Lazy-loading på komponentnivå er ikke koblet inn i wiki-renderer enda; komponentene er klargjort for dette i neste task som integrerer exploration-rendering.

## 2026-02-18 — TASK-028: GeoGebra embed

### Beslutning: Sandboxed iframe + viewport-basert lazy-load
- **Valg:** Implementerte `GeoGebraEmbed` med `IntersectionObserver` (rootMargin 200px) slik at iframe først lastes når komponenten nærmer seg viewport.
- **Begrunnelse:** Reduserer unødvendig nettverks- og renderkost i wiki-sider med mange elementer.

### Beslutning: Robust fallback-strategi
- **Valg:** Støtter både `materialId` og direkte `url`, viser skeleton mens iframe laster, og alltid en «Åpne i GeoGebra»-lenke som fallback.
- **Begrunnelse:** Gir stabil UX også ved treg lasting eller blokkering i embed.

## 2026-02-18 — TASK-030: Semesterplan wizard

### Beslutning: Levert 5-stegs veiviser med sessionStorage-persistens
- **Valg:** Implementerte klientveiviser på `/laerer/semesterplan/ny` med steg for dato, ukerytme, fridager, vurderinger og tema-rekkefølge.
- **Begrunnelse:** Dekker kjernen i TASK-030 og tåler refresh uten datatap via `sessionStorage`.

### Beslutning: Ren generator-funksjon for planutregning
- **Valg:** La all planlogikk i `lib/semester/generator.ts` med egne Vitest-enhetstester.
- **Begrunnelse:** Gir testbar og gjenbrukbar kjerne som senere kan brukes av kalender/DnD-taskene.

### Avgrensning i denne iterasjonen
- DnD i steg 5 er løst som rask rekkefølgekontroll med opp/ned-knapper (ikke full drag-and-drop-bibliotek ennå).
- Norske fridager er seedet for 2026–2027 som startpakke; listen må oppdateres ved nytt skoleår.

## 2026-02-18 — TASK-031: Semesterplan kalender + DnD-redigering

### Beslutning: Lettvekts kalendereditor med server actions
- **Valg:** Implementerte `/laerer/semesterplan/[id]` med `SemesterPlanEditor` som støtter kalendervisning + tabellvisning, drag-and-drop mellom datoer, og autosave via server action (`updateSemesterPlanEntries`).
- **Begrunnelse:** Gir rask redigerbar MVP uten ekstra DnD-bibliotek, med robust persistering direkte mot `semester_plan_entries`.

### Beslutning: Chat-redigering i avgrenset, trygg kommandomodell
- **Valg:** La til `applySemesterPlanChatEdit` med støttet format `Flytt <tema> til etter <tema>`.
- **Begrunnelse:** Oppfyller krav om naturlig språk-editing, men med kontrollert parser for å unngå uforutsigbare planendringer i MVP.

### Beslutning: Versjonering som eksplisitt brukerhandling
- **Valg:** La til `saveSemesterPlanVersion` som tar snapshot av entries og øker `semester_plans.version`.
- **Begrunnelse:** Gir trygg rollback-historikk uten å versjonere hver autosave-operasjon.

### Avgrensning i denne iterasjonen
- Kalenderen er dag-bucket-basert (ikke full måned-grid enda), men inkluderer flytting mellom datoer og tabell-toggle.
- Chat-editor støtter foreløpig én robust kommandoform; flere mønstre kan utvides i senere task.

## 2026-02-18 — TASK-033: Aktivitetslogging

### Beslutning: Sentral tracker for aktivitet + progresjonsaggregater
- **Valg:** La til `lib/progress/tracker.ts` med `logActivity()` som standard inngang for aktivitetslogging og oppdatering av `student_profiles` ved oppgaveforsøk.
- **Begrunnelse:** Reduserer duplisering på tvers av features (øvelser, wiki, chat/video senere) og gir ett sted for progresjonsregler.

### Beslutning: Wiki visningstid via beacon
- **Valg:** La til `WikiViewLogger` som sender `view_start` ved mount og `view_end` + `durationSeconds` via `navigator.sendBeacon` ved pagehide/unmount.
- **Begrunnelse:** Oppfyller kravet om ikke-blokkerende logging av lesetid uten å påvirke UI-flyt.

### Beslutning: Gradvis mestring/strev-beregning fra nyere forsøk
- **Valg:** Re-kalkulerer `mastered_competency_goals` (`>=3` suksesser) og `struggling_competency_goals` (`>=3` feil uten mestring) basert på siste forsøk.
- **Begrunnelse:** Enkel, forståelig heuristikk som kan justeres senere når vi har mer data.

### Avgrensning i denne iterasjonen
- Ingen full tidsakkumulering fra alle aktivitetstyper ennå (kun eksplisitt økningslogikk ved exercise_attempt i tracker).
- Chat/video/flashcard kobles på samme tracker i senere tasks.

## 2026-02-18 — TASK-029: Planet journey (lineær)

### Beslutning: Lettvekts planetkart med SVG-trasé + klikkbare noder
- **Valg:** Implementerte `PlanetMap` + `PlanetNode` i `components/journey/` med horisontal desktop-trasé (SVG stiplet linje) og mobilvennlig scroll-layout.
- **Begrunnelse:** Oppfyller kravene om lineær progresjonsvisualisering uten tung 3D-stack, samtidig som UX holder seg rask og responsiv.

### Beslutning: Progresjon basert på fullførte øvinger per tema
- **Valg:** `fremgang`-siden beregner tema-status som `completed/current/future` ved å sammenligne publiserte øvinger mot elevens `exercise_attempts`.
- **Begrunnelse:** Matcher task-kravet («fullført når alle øvelser er forsøkt») og gir tydelig neste tema uten ekstra backend-kompleksitet.

### Beslutning: Semesterplan styrer rekkefølge, med trygg fallback
- **Valg:** Henter siste `semester_plan_entries` for elevens klasse og bruker topic-rekkefølgen derfra; fallback til en kort standardliste når plan mangler.
- **Begrunnelse:** Sikrer at siden fungerer både med og uten aktiv semesterplan i databasen.

### Avgrensning i denne iterasjonen
- Nåværende side viser progresjonsprosent + neste tema, men inkluderer ikke avansert statusbanner («i rute/foran/bak») fra TASK-032.
- Lenker bruker slugging av topic-navn (forventet samsvar med wiki-ruter), med mulighet for å bytte til eksplisitt topic-slugfelt senere.

## 2026-02-18 — TASK-032: Semesterplan elevvisning

### Beslutning: Statusbanner drives av måloppnåelse (kompetansemål), ikke bare øvingsklikk
- **Valg:** La til `lib/semester/progress.ts` for å beregne `on_track/ahead/behind` ved å sammenligne planlagte tema fram til i dag med tema der alle kompetansemål er i `student_profiles.mastered_competency_goals`.
- **Begrunnelse:** Tettere kobling til læringsmål enn ren aktivitetsmengde, og matcher kriteriet om status «i rute/foran/bak».

### Beslutning: Read-only elevvisning i samme `/fremgang`-flate
- **Valg:** Holdt elevsiden uten redigeringskontroller, med tydelig planinformasjon (neste tema + dato + temaetiketter per planet).
- **Begrunnelse:** Oppfyller kravet om visning uten mutasjonsmulighet og holder UX enkel for elev.

### Erfaring: Krever topic→kompetansemål-oppslag fra publisert innhold
- **Lærdom:** For statusberegning må vi hente `content_elements.competency_goals` per topic. Dette fungerer nå, men blir enda bedre når topic-slugs/ID-er standardiseres i senere tasks.

## 2026-02-18 — TASK-034: Bildeopplasting for oppgaver

### Beslutning: Egen API-route for image-check med multipart + rate limit
- **Valg:** Implementerte `POST /api/exercise/image-check` som mottar `FormData` (metadata + fil), validerer type/størrelse, håndhever `RATE_LIMITS.imageUpload`, og returnerer norsk feilmelding ved 429/valideringsfeil.
- **Begrunnelse:** Robust filhåndtering og tydelig separasjon mellom UI og backendflyt for bildekontroll.

### Beslutning: Persistér image-attempt som egen `exercise_attempt`
- **Valg:** Utvidet `recordExerciseAttempt` med `imageUrl` + `imageFeedback`, og lagrer image-check som `check_method='image_check'` i samme tabell som øvrige forsøk.
- **Begrunnelse:** Holder all oppgavehistorikk konsistent i én datamodell og gjenbruker eksisterende aktivitetslogging.

### Beslutning: Gemini-analyse via lettvekts `fetch`-adapter
- **Valg:** La til `lib/ai/image-analyzer.ts` som kaller Gemini Flash-endepunkt direkte med inline base64-bilde + norsk lærerprompt.
- **Begrunnelse:** Får fungerende AI-feedback uten å introdusere ny tung SDK i MVP.

### Avgrensning i denne iterasjonen
- UI viser opplastingsstatus/feedback inline i `ExerciseBlock`, men uten historikkvisning av tidligere opplastede bilder ennå.
- Hvis Google API-nøkkel mangler, lagres bilde fortsatt og brukeren får tydelig fallback-melding om at AI-feedback er utilgjengelig.

### Beslutning: Wiki-søk med Supabase RPC + FTS
- **Valg:** Implementerte søk som en Supabase `search_content` RPC-funksjon med `plainto_tsquery('norwegian', ...)` over `content_elements.fts`.
- **Begrunnelse:** FTS er allerede indeksert (GIN) og gir sub-100ms søk. RPC holder logikken i DB og unngår komplekse klient-queries. `plainto_tsquery` er trygg mot SQL-injeksjon og håndterer vilkårlig brukerinput.
- **UI:** Cmd/Ctrl+K dialog med tastaturnavigasjon, debounced input (250ms), resultater gruppert etter content_type.
- **Alternativ vurdert:** Klient-side search med Fuse.js → droppet fordi FTS allerede finnes og skalerer bedre.

<!-- NYE ENTRIES LEGGES TIL UNDER HER -->
