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

### Beslutning: TASK-036 med miljøstyrte E2E-tester (Playwright)
- **Valg:** Implementerte `playwright.config.ts` + to E2E-specs (`e2e/wiki.spec.ts`, `e2e/content-admin.spec.ts`) med `test.skip(...)` når test-credentials mangler.
- **Begrunnelse:** Integrasjonstestene krever seedet Supabase-data og testbrukere. Ved å gate med env-variabler kan testene kjøre i CI/staging uten å gi falske røde bygg lokalt.
- **Tradeoff:** Testene verifiserer realistiske brukerflyter, men krever eksplisitt miljøoppsett (`E2E_ADMIN_*`, `E2E_STUDENT_*`, ev. `PLAYWRIGHT_BASE_URL`).

## 2026-02-18 — TASK-040: Chat bildeopplasting

### Beslutning: Klientside opplasting til Supabase med privat sti per bruker
- **Valg:** La til `ImageAttach` i chat composer, med validering (JPEG/PNG/WEBP, maks 10MB), preview før sending, og opplasting til `user-uploads/{userId}/chat/{messageId}.ext`.
- **Begrunnelse:** Gir enkel flyt for mobilkamera/filvelger uten å blokkere chat-UI, og følger krav om lagringsstruktur for chatbilder.

### Beslutning: API-bildeanalyse som ekstra kontekst i chat-respons
- **Valg:** Oppdaterte `POST /api/chat` til å hente bildet fra Supabase, kjøre Gemini-bildeanalyse og injisere en kort bildebeskrivelse i siste user-melding før LLM-kall.
- **Begrunnelse:** Oppfyller krav om at bildeinnhold brukes i tutor-svaret uten å endre resten av chatarkitekturen.

### Beslutning: Thumbnail-støtte med signed URLs for private bucket
- **Valg:** User-meldinger med `image_url` får signed URL (1 time) i server-rendered historikk, og nye meldinger får preview via metadata i klient.
- **Begrunnelse:** Bucket er privat; signed URLs gir visning i UI uten å eksponere objektene offentlig.

### Beslutning: Egen rate limit for chat-bilder
- **Valg:** Bruker `RATE_LIMITS.imageUpload` i `/api/chat` når `imageUrl` er satt (20/time per bruker).
- **Begrunnelse:** Matcher PRD-kravet for bildeflyt og beskytter API-kost/ressurser.

## 2026-02-18 — TASK-041: Elevprofil + mål

### Beslutning: Egen profilside med tydelig status + lav friksjon
- **Valg:** Implementerte `/profil` med tre hovedseksjoner: elevinfo, statistikk-kort og kompetansegrid (R1-01..R1-12).
- **Begrunnelse:** Samler kjerneinnsikt i én visning og gir tydelig «hvor står jeg nå?» for eleven.

### Beslutning: Mål lagres i `student_profiles.goals` via server action
- **Valg:** La til `saveStudentGoals` som validerer målkarakter (1–6) og fokusområder, og lagrer som `target_grade` + `focus_areas` i JSONB.
- **Begrunnelse:** Holder modellen fleksibel for senere utvidelser (f.eks. delmål, tidsfrister) uten ny migrasjon.

### Avgrensning i denne iterasjonen
- «Streak» vises ikke separat ennå; foreløpig brukes aktivitetsvolum siste 7 dager som ukesindikator.
- Lærerens read-only profilvisning kommer i senere dashboard-task (ikke del av TASK-041).

## 2026-02-18 — TASK-042: AI studieanbefalinger

### Beslutning: Aggregert anbefalingsmotor med server-cache
- **Valg:** Implementerte `lib/ai/recommendations.ts` som bygger anbefalinger fra aggregerte elevdata (mål, feilrate per kompetansemål, aktivitetsnivå), med 24t in-memory cache per elev + profilhash.
- **Begrunnelse:** Oppfyller krav om personvernvennlig prompt (ingen rå persondata) og reduserer unødige LLM-kall ved uendret profil.

### Beslutning: Profil-UI med tvungen oppdatering og rate limit
- **Valg:** La til `ProfileRecommendations` på `/profil`, med skeleton ved lasting, fallback-tekst ved tom historikk, og knapp for «Oppdater anbefalinger» som går via API.
- **Begrunnelse:** Gir tydelig, elevvennlig flyt og oppfyller kravet om manuell refresh ved behov.

### Beslutning: Egen API-route for anbefalinger
- **Valg:** Implementerte `GET /api/profile/recommendations` med `force=1`, knyttet til `RATE_LIMITS.recommendations` (1/time) og `Retry-After` ved 429.
- **Begrunnelse:** Holder policy (unngå spam/overforbruk), og gir forutsigbar backend-kontrakt mellom UI og anbefalingsmotor.

### Avgrensning i denne iterasjonen
- LLM-kallet bruker eksisterende Gemini-modell i prosjektet for å unngå ny SDK/konfig i denne tasken; fallback-regler genererer fortsatt 2–3 konkrete anbefalinger om LLM-feiler.

<!-- NYE ENTRIES LEGGES TIL UNDER HER -->

## 2026-02-18 — TASK-043: Tverrfaglig differensiering i chat

### Beslutning: Egen policy-funksjon for kryssfaglig RAG
- **Valg:** Innførte `buildCrossSubjectSearchConfig()` i `lib/rag/hybrid-search.ts` som beregner søkemodus fra elevprofil.
- **Regler:**
  - `mastered > 8` → kryssfaglig søk aktivert + R2-boost.
  - `struggling > 4` → kryssfaglig søk aktivert + 1T/1P-boost.
  - ellers → søk begrenses til elevens nåværende fag.
- **Begrunnelse:** Holder tersklene eksplisitte, testbare og gjenbrukbare i API-laget.

### Beslutning: Nivådifferensiering uten å avsløre kildefag
- **Valg:** Oppdaterte systemprompt med eksplisitt regel om aldri å skrive at forklaring kommer fra R2/1T/1P.
- **Begrunnelse:** Oppfyller produktkravet om skjult differensiering og unngår at elever opplever «nivåmerking» i dialogen.

### Erfaring: Testbarhet øker ved å isolere beslutningslogikk
- **Valg:** La til `hybrid-search.test.ts` med tre enhetstester for default/advanced/supportive modus.
- **Resultat:** `tsc --noEmit` og `vitest run` grønt etter endringene.

### TASK-044: Soft-delete for samtaler
- **Valg:** Bruker `deleted_at TIMESTAMPTZ` for soft-delete i stedet for fysisk sletting.
- **Begrunnelse:** GDPR-krav: faktisk sletting skjer ved kontosletting, ikke ved brukerhandling. Gir mulighet for gjenoppretting og audit trail.
- **Valg:** Klientside søkefiltrering i sidebar (ikke server-side).
- **Begrunnelse:** Med maks 50 samtaler lastet er klientside-filtrering raskere og enklere enn en ny API-rute.

### TASK-050: Sideintervaller lagres per innlevering
- **Valg:** La til `start_page` og `end_page` direkte på `exam_submissions` i stedet for separat mapping-tabell.
- **Begrunnelse:** Forenkler grading-pipelinen (én rad per elev-innlevering med alt nødvendig kontekst) og reduserer join-kompleksitet i neste task.

### TASK-050: Validering av sideintervaller i klient før oppstart
- **Valg:** Blokkerer «Start retting» ved overlapp eller ufullstendige intervaller.
- **Begrunnelse:** Fanger de vanligste operatørfeilene tidlig og hindrer feil i batch-retting.

## 2026-02-19 — TASK-051: AI-retting + feilanalyse

### Beslutning: OCR + scoring som separerte moduler
- **Valg:** Delte pipelinen i `lib/ai/ocr.ts` (Gemini Flash OCR) og `lib/ai/exam-grader.ts` (scoring + aggregasjon).
- **Begrunnelse:** Gjør feilsøking og videre modellbytte enklere (OCR og scoring kan optimaliseres uavhengig).

### Beslutning: PDF-sideuttrekk per elev med `pdf-lib`
- **Valg:** Ekstraherer elevens sideintervall til enkelt-sider før OCR.
- **Begrunnelse:** Sikrer at OCR-kontekst matcher riktig elev og reduserer risiko for krysskontaminering mellom besvarelser.

### Beslutning: Standardiserte feilkategorier i `error_analysis`
- **Valg:** Tvangsstruktur for `fortegnsfeil`, `konseptfeil`, `regnefeil`, `manglende_steg` + `details`.
- **Begrunnelse:** Gir direkte kobling til lærerens review-behov og muliggjør senere statistikk/rapportering per feiltype.

## 2026-02-19 — TASK-052: Resultatvisning

### Beslutning: Server-side aggregasjon + client-side detaljflyt
- **Valg:** Bygde `/laerer/prover/[id]/resultater` som server-side dataload med aggregert klasseoversikt og per-elev detaljer, sendt til client-view for interaksjon.
- **Begrunnelse:** Rask first-render og enkel state-håndtering for detaljpanel + overstyring.

### Beslutning: Overstyring lagres som sann kilde i DB
- **Valg:** `overrideExamAnswerScore` oppdaterer `exam_answers.score_percent`, setter `teacher_override = true`, og rekalkulerer `exam_submissions.total_score_percent` vektet mot `max_points`.
- **Begrunnelse:** Hindrer mismatch mellom spørsmålsscore og totalscore, og gjør lærerens manuelle vurdering autoritativ.

### Beslutning: Realtime via `router.refresh()` på `exam_submissions`
- **Valg:** Client-komponenten abonnerer på Supabase Realtime-endringer på `exam_submissions` for eksamen og refresher visningen.
- **Begrunnelse:** Enkelt og robust for MVP; gir live progresjon uten å innføre ekstra polling/API-lag.

## 2026-02-19 — TASK-053: Elevgenererte øvingsprøver

### Beslutning: Gjenbruk av eksisterende prøvegenerator
- **Valg:** Elev-UI (`/oving-prove`) bruker samme `POST /api/exams/generate` som lærerflyten, med `examType: 'practice'`.
- **Begrunnelse:** Minimerer duplisert logikk og holder kvalitet/oppgavestil konsistent mellom lærerprøver og øvingsprøver.

### Beslutning: Rollebasert avgrensing i API
- **Valg:** Studenter kan kun opprette practice-prøver, lærere/admin kan kun opprette vanlige prøver.
- **Begrunnelse:** Forhindrer rollelekasje og gjør API-kontrakten eksplisitt.

### Beslutning: Practice rate limit
- **Valg:** 5 øvingsprøver per dag per elev.
- **Begrunnelse:** Matcher task-krav og beskytter mot misbruk/kostnadsburst.

### Erfaring: Self-report lagring uten full vurderingspipeline
- **Valg:** Interaktiv modus lagrer samlet selvrapportert score i `exam_submissions` via ny endpoint `/api/exams/[id]/practice-submit`.
- **Begrunnelse:** Leverer MVP-kravet for digital gjennomføring uten å blande inn OCR/AI-retting som kun gjelder lærerinnleveringer.

## 2026-02-19 — TASK-054: Phase 3 integrasjonstest

### Beslutning: Lettvekts E2E med miljø-gating
- **Valg:** La til `e2e/exams.spec.ts` med skip-gating på E2E-credentials i miljøvariabler.
- **Begrunnelse:** Holder CI stabil når testkontoer/seed mangler, men gir komplett flyt når miljø er satt opp.

### Beslutning: Dekning på minimumskrav først
- **Valg:** Testene verifiserer tre kritiske flyter: lærer genererer prøve + PDF, lærer åpner retteside, elev genererer øvingsprøve + PDF-valg.
- **Begrunnelse:** Rask regressjonsdekning for Phase 3 uten å introdusere skjør avhengighet til OCR/retting i CI.

## 2026-02-19 — TASK-055: Klasseoversikt + heatmap

### Beslutning: Implementere dashboard på eksisterende `/laerer`-rute
- **Valg:** Bygde heatmap og varsler i `src/app/(teacher)/laerer/page.tsx` i stedet for ny `app/(teacher)/page.tsx`.
- **Begrunnelse:** Eksisterende navigasjon og role redirects peker allerede til `/laerer`; unngår rutebrudd og holder endringen bakoverkompatibel.

### Beslutning: 5-minutters ISR for nær-realtime
- **Valg:** `export const revalidate = 300` på dashboardsiden.
- **Begrunnelse:** Oppfyller task-kravet om Realtime/polling med lav kompleksitet i MVP, uten ekstra klientabonnement.

### Beslutning: Mestringsprosent som avledet modell (100/65/25)
- **Valg:** Utledet cellenivå i heatmap fra `mastered_competency_goals` (100), `struggling_competency_goals` (25), ellers 65.
- **Begrunnelse:** Databasen lagrer ikke eksplisitt prosent per mål; denne modellen gir konsistent R/G/Y-klassifisering nå og kan erstattes av ekte prosentfelt senere.

### Beslutning: «Bak plan» via planlagte temaer vs unike fullførte temaer
- **Valg:** Beregner avvik som `planlagte topic-entries til dags dato - unike topics i elevens exercise_attempt-aktivitet`.
- **Begrunnelse:** Bruker eksisterende data uten nye migrasjoner, og leverer direkte indikator for >2 tema bak plan.

## 2026-02-19 — TASK-056: Per-elev detaljvisning

### Beslutning: Egen detaljside på `/laerer/elev/[studentId]` med sammensatt datavisning
- **Valg:** Implementerte lærervisning som henter elevprofil (`student_profiles`), aktivitet siste 30 dager (`activity_log`), prøveresultater (`exam_submissions` + `exams`) og chat-oppsummering (antall samtaler + meldinger siste uke uten innhold).
- **Begrunnelse:** Oppfyller krav om helhetlig elevbilde i én side, samtidig som vi holder personvern ved å vise aggregater i stedet for chat-innhold.

### Beslutning: Lærernotater auto-saves via server action på blur
- **Valg:** La til `saveTeacherNote` (`app/actions/teacher-notes.ts`) og klientkomponent `TeacherNotes` som lagrer automatisk når tekstfelt mister fokus.
- **Begrunnelse:** Reduserer risiko for datatap i lærerarbeidsflyt og oppfyller acceptance-krav om auto-save uten ekstra lagre-knapp.

### Beslutning: Tilgangskontroll verifiseres både via rolle og klassemedlemskap
- **Valg:** På detaljsiden sjekkes `requireRole(['teacher','admin'])`, og for lærerrollen verifiseres at eleven finnes i en klasse der læreren er eier før data vises/saves.
- **Begrunnelse:** Gir eksplisitt håndheving av «teacher can only see students in their classes» i tillegg til RLS som backend-sikkerhet.

## 2026-02-19 — TASK-057: AI-generert vurderingsrapport

### Beslutning: Egen rapport-modul + API + redigerbar UI
- **Valg:** Implementerte `lib/ai/assessment-report.ts`, ny endpoint `POST /api/teacher/assessment-report`, og klientkomponenten `AssessmentReport` på elevdetaljsiden.
- **Begrunnelse:** Holder rapportlogikk isolert, lar lærer trigge rapport når ønsket, og støtter redigering før lagring.

### Beslutning: Lagring som egen notattype i `teacher_notes`
- **Valg:** Utvidet actions med `saveAiAssessmentReport()` som upserter `note_type='ai_report'` separat fra manuelle notater.
- **Begrunnelse:** Skiller systemgenerert vurderingsutkast fra fritekstnotater, og gjør audit/videre rapportarbeid enklere.

### Sikkerhetsvalg: kun aggregert input til LLM
- **Valg:** Sender kun aggregert statistikk (mål, progresjon, score, aktivitetsvolum), ikke rå chat-innhold/persondata.
- **Begrunnelse:** Oppfyller krav om minst mulig dataeksponering i AI-kall og bedre personvern-by-design.

## 2026-02-19 — TASK-058: Prøveadmin panel

### Beslutning: Egen oversiktsside for prøver på `/laerer/prover`
- **Valg:** Implementerte server-rendered oversikt med alle lærerens prøver sortert på `created_at desc`.
- **Begrunnelse:** Oppfyller task-krav om ett sted for status, nøkkeltall og hurtighandlinger uten å spre flyten på flere sider.

### Beslutning: Statusstyrte handlinger per prøverad
- **Valg:** `draft -> Rediger`, `ready -> Last ned PDF`, `completed -> Se resultater`.
- **Begrunnelse:** Gir tydelig og kontekstavhengig neste steg for læreren, og matcher acceptance-kriteriene direkte.

### Beslutning: Aggregert vurderingsstatistikk fra `exam_submissions`
- **Valg:** Beregner «vurdert/innleveringer» og snittscore per prøve i siden (inkluderer status `graded` og `reviewed` som vurdert).
- **Begrunnelse:** Krever ingen ny DB-struktur og gir praktisk beslutningsstøtte i dashboardet med minimal kompleksitet.
## 2026-02-19 — TASK-059: Content review workflow

### Beslutning: Egen flagget-kø for admin med hurtighandlinger
- **Valg:** La til `/admin/innhold/flagget` + `FlaggedQueue`-komponent som viser flagggrunn, type, kompetansemål, preview og hurtigvalg for godkjenn/avvis.
- **Begrunnelse:** Oppfyller behovet for prioritert triage uten å åpne full editor for hver sak.

### Beslutning: Review-audit synlig i køen
- **Valg:** Viser `reviewed_by` + `reviewed_at` med navnoppslag fra `profiles` der mulig.
- **Begrunnelse:** Gir tydelig sporbarhet på hvem som behandlet innhold og når.

### Beslutning: Lærerflyt som read-only + flagg med kommentar
- **Valg:** Implementerte `/laerer/innhold` som publisert read-only liste med kommentarfelt for flagging til admin.
- **Begrunnelse:** Oppfyller kravet om at lærer kan melde kvalitetssaker uten å få direkte redigeringsansvar.

### Beslutning: Dashboard-badge for flagget innhold
- **Valg:** La til innholdsreview-kort på `/laerer` med flagget teller og rolleavhengig snarvei (`/admin/innhold/flagget` for admin, `/laerer/innhold` for lærer).
- **Begrunnelse:** Gjør flagget innhold synlig på dashboard home slik tasken krever.

## 2026-02-19 — TASK-060: Semesterplan-widget i lærerdashboard

### Beslutning: Egen serverkomponent for ukesvisning
- **Valg:** La til `components/dashboard/semester-widget.tsx` som henter siste semesterplan for klassen og viser neste 5 `semester_plan_entries` fra dagens dato.
- **Begrunnelse:** Holder dashboard-siden ryddig og gjør widgeten gjenbrukbar/testbar separat.

### Beslutning: Varsel ved gjennomsnittlig avvik > 2 tema
- **Valg:** Beregner `averageBehindTopics` fra eksisterende dashboard-data (`behindByTopics`) og viser varsel i widgeten når snittet er over 2.
- **Begrunnelse:** Matcher acceptance-kriteriet uten ny datamodell.

### Beslutning: Direkte snarvei til planredigering
- **Valg:** Widgeten lenker til `/laerer/semesterplan/[id]` for siste plan, eller `/laerer/semesterplan/ny` hvis plan mangler.
- **Begrunnelse:** Gir tydelig neste handling direkte fra dashboardet.

## 2026-02-19 — TASK-061: Brukeradmin (admin)

### Beslutning: Full adminflate på `/admin/brukere` med server actions
- **Valg:** Implementerte en komplett brukeradmin-side med søk, paginering (50 per side), rolleskifte per bruker, deaktiver/reaktiver, hard delete med skrivebekreftelse, og CSV-bulkimport (`name,email`).
- **Begrunnelse:** Oppfyller acceptance-kriteriene i én samlet operativ flate uten å introdusere ekstra API-ruter for enkel CRUD.

### Beslutning: Service-role-klient for sensitive auth-operasjoner
- **Valg:** La til `createAdminClient()` i `lib/supabase/admin.ts` og bruker den kun i server actions for `auth.admin.deleteUser`, `auth.admin.inviteUserByEmail`, og `auth.admin.listUsers` (sist innlogget).
- **Begrunnelse:** Krever service role for auth-admin handlinger; isolering i serverkode reduserer risiko for feilbruk.

### Beslutning: Audit-logg for adminhandlinger
- **Valg:** La til migrasjon `0009_admin_user_audit_log.sql` + logging av role_change, deactivate/reactivate, delete og bulk_invite.
- **Begrunnelse:** Gir sporbarhet og etterprøvbarhet på kritiske brukerendringer.

### Beslutning: Deaktiverte kontoer stoppes ved innlogging
- **Valg:** Oppdaterte `login`-action til å sjekke `profiles.deactivated_at` etter vellykket auth og signere ut direkte ved deaktivert konto.
- **Begrunnelse:** Oppfyller kravet om at deaktiverte brukere ikke skal få aktiv sesjon.

## 2026-02-19 — TASK-062: Phase 4 integrasjonstest

### Beslutning: Egen Playwright-spec for lærer/admin-flyt
- **Valg:** La til `e2e/teacher-dashboard.spec.ts` med fire kjerneflyter: heatmap→elevdetalj, notatpersistens, AI-rapportgenerering/redigering, og admin rolleendring i brukeradmin.
- **Begrunnelse:** Samler hele phase-4-verifikasjonen i én testfil og matcher acceptance-kriteriene direkte.

### Beslutning: Miljø-gating på credentials
- **Valg:** Testene skipper automatisk når E2E-credentials mangler (`E2E_TEACHER_*`, `E2E_ADMIN_*`, `E2E_STUDENT_EMAIL`).
- **Begrunnelse:** Holder lokal/CI-kjøring robust uten falske røde bygg i miljøer uten seedede testkontoer.

## 2026-02-19 — TASK-063: Flashcard-generering

### Beslutning: Generer flashcards per tema som mangler
- **Valg:** Nytt script `scripts/generate-flashcards.ts` som finner publiserte tema uten eksisterende flashcards, genererer 6–10 kort per tema og lagrer dem som `draft` i `content_elements`.
- **Begrunnelse:** Treffer task-kravet om batch-generering av manglende flashcards uten å lage duplikater for tema som allerede har kort.
- **Teknisk:** Scriptet støtter `--subject`, `--limit` og `--dry-run`.

### Beslutning: Egen generator-modul for flashcards
- **Valg:** Ny modul `src/lib/generation/flashcard-generator.ts` med LLM-kall + robust JSON-parsing + normalisering.
- **Begrunnelse:** Holder scripts tynne og gjør flashcard-logikk gjenbrukbar for senere TASK-064/065.

### Beslutning: Admin kan recategorize content-type i review
- **Valg:** Utvidet `ContentEditor` og `saveContentEdit` med `contentType`-felt slik admin kan bytte mellom `flashcard` og andre content-typer under review.
- **Begrunnelse:** Dekker akseptansekriteriet om at admin kan korrigere feil kategorisering uten egen migrasjon eller ny side.

## 2026-02-19 — TASK-064: Flashcard study UI + SM-2

### Beslutning: Server-renderet KaTeX + klientdrevet øktflyt
- **Valg:** Bygde `/flashcards` som server-side datainnhenting + markdown/KaTeX-rendering til HTML, med klientkomponent (`FlashcardSession`) for reveal/rating-flyt.
- **Begrunnelse:** Oppfyller KaTeX-kravet uten å dra inn ekstra klientbibliotek for markdown-math, samtidig som interaksjonene holder seg responsive.

### Beslutning: SM-2 som isolert domene-logikk med enhetstester
- **Valg:** Implementerte algoritmen i `lib/flashcards/sm2.ts` med Vitest i `sm2.test.ts` (første/andre repetisjon, reset ved lav kvalitet, EF-gulv 1.3).
- **Begrunnelse:** Gjør spaced repetition-logikken eksplisitt, testbar og enkel å gjenbruke videre.

### Beslutning: Forfall først, deretter nye kort
- **Valg:** Økta sorterer kort som `next_review <= today` først, deretter kort uten `flashcard_progress`.
- **Begrunnelse:** Matcher ønsket læringsflyt i tasken og prioriterer repetisjon før nytt stoff.

### Leveranse i tasken
- Ny server action `rateFlashcard` som oppretter/oppdaterer `flashcard_progress` med SM-2-felter.
- Reveal av kort via klikk eller Space.
- Tre vurderingsvalg: **Husket (5)**, **Nesten (3)**, **Glemte (1)**.
- Mobilgester: swipe høyre = Husket, swipe venstre = Glemte.
- Progressbar `N/total` og avslutningsskjerm «Kom tilbake i morgen» når økta er tom.
- Ny side `/flashcards/alle` for browsing av alle publiserte kort i elevens fag.

### Avgrensning
- Swipe opp = «Nesten» og full-screen safe-area/flip-animasjon er planlagt under TASK-065 (mobile polish).

## 2026-02-19 — TASK-065: Mobil-optimalisert flashcard-layout

### Beslutning: Utvidet geststyring direkte med pointer-events
- **Valg:** Rebrukte `FlashcardCard` og la inn pointer-basert swipe-detektering: høyre=Husket, venstre=Glemte, opp=Nesten.
- **Begrunnelse:** Unngår ekstra gesture-avhengigheter, holder bundle mindre og gir god kontroll på terskler/oppførsel.

### Beslutning: Mobil-først kortpresentasjon
- **Valg:** Kortarealet er satt til `min-h-[62svh]` på mobil, med `touch-manipulation`, safe-area-bunnpadding og `overflow-x-hidden` på siden.
- **Begrunnelse:** Gir mer «app»-følelse, bedre ergonomi, og reduserer risiko for utilsiktet zoom/scroll.

### Beslutning: Flip-animasjon med tilgjengelighetsfallback
- **Valg:** 3D flip mellom forside/bakside med `motion-safe`, og automatisk redusert animasjon for brukere med `prefers-reduced-motion`.
- **Begrunnelse:** Visuell tydelighet uten å kompromisse tilgjengelighet.

### Leveranse i tasken
- Swipe opp for **Nesten** med gul visuell feedback.
- Fargefeedback ved swipe høyre/venstre/opp (grønn/rød/gul flash).
- Knapper med minimum 48px høyde.
- «Kom tilbake i morgen»-skjerm viser nå neste anbefalte dato.

## 2026-02-19 — TASK-066: Manim script-generering

### Beslutning: Claude Sonnet for scriptgenerering
- **Valg:** Bruker Claude Sonnet 4.6 via Anthropic API direkte for å generere Manim CE Python-scripts.
- **Begrunnelse:** Sonnet balanserer kvalitet og kostnad for kodegenerering; Opus er overkill for template-basert scriptproduksjon.

### Beslutning: Syntaktisk validering i TypeScript
- **Valg:** Validerer genererte scripts med enkel sjekk (imports, class, construct, balanserte paranteser, manimlib-avvisning) i stedet for å kjøre Python AST.
- **Begrunnelse:** Unngår Python-avhengighet i genereringspipeline; fanger de vanligste feilene. Full Python-validering skjer i TASK-067 renderpipeline.

### Leveranse i tasken
- `manim-script-generator.ts` med `generateManimScript()` og `validateManimScript()`.
- CLI-script `scripts/generate-manim-scripts.ts` med `--dry-run`, `--limit`, `--element`, retry (3x).
- 5 Vitest-tester for valideringsfunksjonen.

## 2026-02-19 — TASK-067: Manim rendering + CDN

### Beslutning: Rendering i GitHub Actions (nattlig)
- **Valg:** Egen workflow `manim-render.yml` som kjører nattlig kl 02:00 UTC og kan trigges manuelt.
- **Begrunnelse:** Isolerer tung rendering fra app-runtime, gir stabil batch-kjøring og enkel feilsøking via artifacts.

### Beslutning: Enkel Python-runner uten tunge SDK-avhengigheter
- **Valg:** `render-manim.py` bruker Supabase REST/Storage via HTTP i stedet for større klientstack.
- **Begrunnelse:** Færre avhengigheter i CI, enklere miljø og mindre vedlikehold.

## 2026-02-19 — TASK-068: Video i wiki

### Beslutning: Lazy-load + signed URL ved visning
- **Valg:** `VideoPlayer` henter signed URL fra `/api/video/[id]/url` først når komponenten er nær viewport (IntersectionObserver).
- **Begrunnelse:** Reduserer initial last, beskytter filtilgang og matcher krav om lazy loading.

### Beslutning: Aktivitet logging på video-slutt
- **Valg:** Ved `ended` sendes fire-and-forget beacon til `/api/activity` med `type=video_watched`.
- **Begrunnelse:** Ikke-blokkerende logging som ikke påvirker avspilling/UX.

### Leveranse i taskene
- `VideoPlayer` komponent med native kontroller + poster + duration badge.
- API route for signed video-URL (24t).
- Wiki eksempel-blokk viser video når `videos.status='ready'` finnes.

## 2026-02-19 — TASK-069: Phase 5 integrasjonstest

### Beslutning: E2E med graceful skip ved manglende seed-data
- **Valg:** Testene skipper eksplisitt når miljøet mangler student-credentials eller når seed ikke har forfalte kort / klare videoer.
- **Begrunnelse:** Holder CI stabil på tvers av miljøer uten å maskere reelle regresjoner i baseline-flow.

### Leveranse i tasken
- `e2e/flashcards.spec.ts`: åpning av flashcards, reveal/rating, mobil swipe-gest.
- `e2e/video.spec.ts`: wiki-navigasjon, videoelement synlig og avspilling starter.

## 2026-02-19 — TASK-070: Lighthouse audit og optimalisering

### Beslutning: Lighthouse CI som PR-gate (warn-terskler først)
- **Valg:** Innført `lighthouse-ci.yml` som kjører på PR/workflow_dispatch med terskler satt til `warn`.
- **Begrunnelse:** Gir kontinuerlig signal uten å blokkere leveranse tidlig i polish-fasen; kan strammes til `error` senere.

### Beslutning: Bundle analyzer bak opt-in env
- **Valg:** Aktivert `@next/bundle-analyzer` via `ANALYZE=true` i `next.config.ts`.
- **Begrunnelse:** Null runtime-kost i normal drift, men rask innsikt når vi trenger chunk-analyse.

### Leveranse i tasken
- `.github/workflows/lighthouse-ci.yml`
- `lighthouserc.json`
- `docs/performance-baseline.md`

## 2026-02-19 — TASK-071: WCAG 2.1 AA audit (baseline)

### Beslutning: Start med strukturell tilgjengelighet først
- **Valg:** Innført global skip-link (`Hopp til hovedinnhold`) og tydelig `main#main-content` landmark i root layout.
- **Begrunnelse:** Lav kost, høy effekt for tastatur-/screenreader-brukere og grunnmur for videre AA-arbeid.

### Beslutning: E2E baseline for a11y-regresjoner
- **Valg:** Ny `e2e/accessibility.spec.ts` som verifiserer skip-link, fokusflyt med tastatur og at sentrale sider har `main`-landmark + heading.
- **Begrunnelse:** Rask regressjonsdekning i CI uten å blokkere på full axe-integrasjon i første iterasjon.

## 2026-02-19 — TASK-072: GDPR (DPIA + personvern)

### Beslutning: Levere dokumentasjon og brukerflate parallelt
- **Valg:** Implementerte både brukerrettet `/personvern` + cookie-banner og styringsdokumenter (`dpia.md`, `gdpr-checklist.md`, `dpa-log.md`) i samme task.
- **Begrunnelse:** GDPR-arbeid må være både teknisk og prosessuelt; dokumentasjon uten UI (eller omvendt) er utilstrekkelig.

### Beslutning: Midlertidig konto-sletting som deaktivering i app-laget
- **Valg:** La inn `deleteOwnAccount()` som deaktiverer profil + signOut som MVP-baseline.
- **Begrunnelse:** Full hard-delete av `auth.users` krever service-role/adminflyt; implementeres strammere i sikkerhetsrunde.

## 2026-02-19 — TASK-073: Rate limiting hardening og sikkerhetsreview

### Beslutning: Standardisert API-auth guard
- **Valg:** Introduserte `requireApiUser()` i `src/lib/auth/api-auth.ts` og brukte den i API-ruter som tidligere kunne gi redirect/500 ved manglende innlogging.
- **Begrunnelse:** API-ruter skal returnere tydelig `401` (ikke HTML-redirect), og auth-sjekk må være konsistent på tvers av routes.
- **Konsekvens:** `activity`, `exercise/image-check` og `video/[id]/url` returnerer nå korrekt auth-feil ved uautentisert kall.

### Beslutning: Sikkerhetsheadere i Next-konfig
- **Valg:** La inn global CSP + sikkerhetsheadere og egen CORS-policy for `/api/:path*` i `next.config.ts`.
- **Begrunnelse:** Reduserer XSS/clickjacking-risiko og låser API-origin til produksjonsdomene.
- **Detalj:** `NEXT_PUBLIC_APP_URL` brukes som tillatt origin (fallback `https://ypsimath.no`).

### Beslutning: Lettvekts sikkerhetsaudit som kode
- **Valg:** Opprettet `docs/security-checklist.md`, SQL-audit i `supabase/tests/security_rls_audit.sql`, og vitest-kontraktstest for auth-guard på alle API-ruter.
- **Begrunnelse:** Gjør sikkerhetsgjennomgangen repeterbar før launch i stedet for engangssjekk.

## 2026-02-19 — TASK-074: Feilovervåking + observability

### Beslutning: Full Sentry-integrasjon via Next.js instrumentation
- **Valg:** La til `@sentry/nextjs` med `sentry.server.config.ts`, `sentry.client.config.ts`, `sentry.edge.config.ts`, `instrumentation.ts` og `instrumentation-client.ts`.
- **Begrunnelse:** Dekker server, klient og edge i samme oppsett, og gir source map + release-sporing på deploy.

### Beslutning: Streng PII-filtrering i telemetry
- **Valg:** `beforeSend` beholder kun `user.id` og fjerner sensitive request-headere (`cookie`, `authorization`).
- **Begrunnelse:** Oppfyller kravet om ingen PII i Sentry-events (ingen navn/e-post), men beholder nok signal for feilsøking.

### Beslutning: Enkel, robust helse-side i admin
- **Valg:** Ny side `/admin/helse` med fire KPI-er: DB-status, API-responstid, feilrate siste 24t, aktive brukere siste 24t.
- **Begrunnelse:** Rask operativ oversikt uten ekstra infrastruktur. Bruker eksisterende Supabase-data og representative backend-spørringer.

### Beslutning: Dokumenterte alert-regler i repo
- **Valg:** La inn `docs/observability.md` med konkrete Sentry-alerts (nye feil, 500-spike, P95 > 3s) og release-praksis.
- **Begrunnelse:** Alert-regler er konfig i Sentry UI, så dokumentasjon i repo gjør oppsett reproducerbart og revisjonsvennlig.

## 2026-02-19 — TASK-075: Brukertest-forberedelser

### Beslutning: Seed-script som klargjør hele testoppsettet
- **Valg:** La til `scripts/seed-test-data.ts` som oppretter 10 testelever + testlærer, sikrer tre publiserte R1-tema med alle nødvendige innholdstyper, lager testklasse/semesterplan og legger inn enkel aktivitetsdata.
- **Begrunnelse:** Gir reproduserbar og rask klargjøring før brukertest uten manuell database-jobbing.

### Beslutning: In-app feedback med lav terskel
- **Valg:** La til `FeedbackButton` i app-shell (NPS 0–10 + fritekst) med server action `submitFeedback` og ny tabell `user_feedback` (migration `0010_user_feedback.sql`).
- **Begrunnelse:** Samler brukertest-feedback direkte i appen under faktisk bruk, i stedet for ekstern lenke med høyere friksjon.

### Beslutning: Strukturert testguide med exit-kriterier
- **Valg:** Opprettet `docs/testing-guide.md` med konkrete elev-/læreroppgaver, målepunkter, bug-severity (P0/P1/P2) og tydelige launch-kriterier.
- **Begrunnelse:** Sikrer konsistent gjennomføring av testøkter og et objektivt grunnlag for go/no-go før lansering.

## 2026-02-19 — Autonom kjøring (06:43 Europe/Berlin)

### Beslutning: Ingen ny implementering når taskkø er tom
- **Valg:** Verifiserte `TASKS.md` og `STATUS.md` i prioritert rekkefølge og stoppet kjøringen uten kodeendringer.
- **Begrunnelse:** Alle tasks i gjeldende plan (TASK-001 … TASK-078) er allerede ferdigstilt. Å implementere noe ekstra uten definert task ville bryte planstyringen.
- **Konsekvens:** Oppdatert status-/beslutningslogg for sporbarhet; ingen `tsc`/`vitest`/feature-commit i denne runden.

## 2026-02-19 — TASK-076: Produksjonslansering (checklist-klargjøring)

### Beslutning: Dokumentere launch som kjørbar sjekkliste i repo
- **Valg:** La til `docs/LAUNCH.md` med komplett sekvens for infrastruktur, domene/TLS, env-variabler, sikkerhet/GDPR, observability, testkrav, soft launch og elevlansering.
- **Begrunnelse:** Selve produksjonssettingen krever manuell/ekstern tilgang; sjekklisten gjør prosessen reproduserbar og reduserer risiko for glemte steg.

### Beslutning: Eget incident-response hurtigkort
- **Valg:** Inkluderte kort prosedyre (verifiser omfang → triage i Sentry/helse → mitigering/rollback → kommunikasjon → post-mortem).
- **Begrunnelse:** Gir tydelig handlingsmønster ved feil i første driftsfase.

## 2026-02-19 — TASK-077: Elev-/lærerdokumentasjon + onboarding

### Beslutning: Egne offentlige hjelpesider for elev og lærer
- **Valg:** La til `/hjelp/elev` og `/hjelp/laerer` med konkrete steg-for-steg guider og FAQ.
- **Begrunnelse:** Gir lavterskel støtte i appen uten at bruker må lete i ekstern dokumentasjon.

### Beslutning: Enkel 3-stegs onboarding-tour i app-shell
- **Valg:** Implementerte `TooltipTour` som viser rollebaserte steg (student: wiki/chat/flashcards, lærer: semesterplan/oversikt/prøver) én gang per rolle via localStorage.
- **Begrunnelse:** Oppfyller onboarding-kravet raskt og uten backend-kompleksitet.

### Beslutning: Egen kontaktside for henvendelser
- **Valg:** La til `/kontakt` med tydelig kontaktkanal og henvisning til intern feedback-knapp.
- **Begrunnelse:** Dekker acceptance-kravet om kontaktflate og knytter støtteflyten sammen med in-app feedback.

## 2026-02-19 — TASK-078: Final regresjonstest

### Beslutning: Egen regression-spec for launch-gating
- **Valg:** La til `e2e/regression.spec.ts` med tre baseline-flyter: personvern/GDPR-sjekk, auth-avvisning på API-endepunkter med rate-limit, og tema-toggling på nøkkelsider.
- **Begrunnelse:** Samler launch-kritiske sjekker i én rask suite som kan kjøres separat i CI.

### Beslutning: Koble regression E2E inn i CI
- **Valg:** Oppdaterte `.github/workflows/ci.yml` med Playwright browser-installasjon og kjøring av `e2e/regression.spec.ts`.
- **Begrunnelse:** Gjør regresjonstesten kontinuerlig i stedet for manuell før release.

## 2026-02-19 — Autonom kjøring (05:03): ingen gjenværende tasks

### Beslutning: Stoppet implementeringssløyfen når taskkøen er tom
- **Valg:** Etter gjennomgang av `STATUS.md` + `TASKS.md` ble ingen ugjorte tasks funnet (alle TASK-001 til TASK-078 står som ✅). Ingen kodeendringer ble derfor initiert.
- **Begrunnelse:** Instruksen sier å finne *neste ugjorte task i rekkefølge* og implementere den. Når ingen gjenstår, er korrekt handling å dokumentere tom kø og unngå unødvendige endringer.
- **Neste steg:** Avventer nye tasks/utvidet backlog før videre implementering.

## 2026-02-19 — Autonom kjøring: ingen gjenværende tasks

### Beslutning: Stopp videre implementering når tasklisten er tom
- **Valg:** Kjøringen avsluttes etter verifisering av at alle tasks i `STATUS.md` er markert ✅ og ingen nye tasks finnes i `TASKS.md`.
- **Begrunnelse:** Unngår kunstige/no-op kodeendringer og holder prosjektets historikk ryddig når scope er fullført.

## 2026-02-19 — Autonom kjøring (06:03): fortsatt tom taskkø

### Beslutning: Ingen no-op implementering når «neste task» ikke finnes
- **Valg:** Bekreftet på nytt at TASK-001…TASK-078 er ferdige og stoppet uten kodeendringer.
- **Begrunnelse:** Instruksen krever implementering av *neste ugjorte task i rekkefølge*; når ingen finnes er korrekt handling å loggføre status, ikke produsere kunstige commits/testkjøringer.
- **Neste steg:** Avventer ny backlog/task-utvidelse før ny utviklingsrunde.

## 2026-02-19 — Autonom kjøring (06:23): fortsatt ingen neste task

### Beslutning: Avslutte runden uten no-op endringer
- **Valg:** Re-sjekket `STATUS.md` og `TASKS.md`; alle tasks (TASK-001 … TASK-078) er fortsatt fullført.
- **Begrunnelse:** Kravet er å implementere neste ugjorte task i rekkefølge. Når ingen finnes, er korrekt handling å loggføre status og stoppe, ikke produsere kunstige kodeendringer eller testkjøringer.
- **Neste steg:** Avventer ny backlog/utvidelse av tasklisten før ny implementeringsrunde.

## 2026-02-19 — Autonom kjøring (07:03 Europe/Berlin)

### Beslutning: Kjør verifikasjonstester selv om taskkø er tom
- **Valg:** Etter ny verifisering av `TASKS.md` + `STATUS.md` (fortsatt TASK-001 … TASK-078 = ✅), ble det kjørt `pnpm -s tsc --noEmit` og `pnpm -s vitest run` for å bekrefte grønn baseline.
- **Begrunnelse:** Ingen ny implementering er mulig uten ny task, men testkjøring gir trygghet for at repoet fortsatt er stabilt ved autonom kjøring.
- **Resultat:** Typecheck passerte, Vitest passerte (18 testfiler / 86 tester). Kun loggfiler ble oppdatert i denne runden.

## 2026-02-19 — Autonom kjøring (07:24 Europe/Berlin)

### Beslutning: Fortsett med verifiseringssløyfe når backlog er tom
- **Valg:** Re-sjekket `TASKS.md` mot `STATUS.md` i prioritert rekkefølge; ingen ugjorte tasks funnet (TASK-001 … TASK-078 = ✅). Kjørte deretter `pnpm -s tsc --noEmit` og `pnpm -s vitest run`.
- **Begrunnelse:** Cron-instruksen ber om kontinuerlig arbeid, men når ingen task kan implementeres er høyeste nytte å bekrefte at kodebasen fortsatt er stabil og dokumentere dette eksplisitt.
- **Resultat:** Typecheck grønn, Vitest grønn (18 filer / 86 tester). Ingen kodeendringer utover oppdatert status- og beslutningslogg.
