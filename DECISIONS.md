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

<!-- NYE ENTRIES LEGGES TIL UNDER HER -->
