# YpsiMath — Product Requirements Document

> **Status**: Draft v1.2
> **Forfatter**: Seland + Claude Opus 4.6
> **Dato**: 2026-02-18
> **Prosjekttype**: Tech-Ed OS for matematikkopplæring i norsk VGS

---

## 1. Visjon og formål

### 1.1 Problemstilling

Digitale læreverk i norsk matematikkundervisning er i praksis HTML-versjoner av trykte bøker. De utnytter ikke potensialet i moderne AI, interaktivitet eller individualisering. Elever får samme lineære pensum uavhengig av nivå, tempo og læringsstil. Lærere bruker uforholdsmessig mye tid på prøvelaging, retting og vurderingsarbeid som kunne vært assistert av AI.

### 1.2 Visjon

YpsiMath er et **tech-ed OS** som redefinerer matematikkopplæring gjennom AI-generert pensum, adaptiv læring og AI-assistert vurdering. Systemet kombinerer en interaktiv wiki med en intelligent chat-tutor, og gir hver elev et individuelt tilpasset læringsløp gjennom matematikkfagene i norsk videregående skole.

### 1.3 Kjerneverdier

- **Didaktisk kvalitet**: Norsk notasjon, beste pedagogiske formuleringer, kvalitetssikret av faglærer
- **Adaptiv læring**: Differensiering på tvers av fag — sterke elever utfordres med stoff fra høyere fag, elever som sliter får støtte fra lavere fag
- **LLM-optimalisert**: Pensum strukturert for effektiv RAG og semantisk søk, samtidig ryddig for mennesker
- **Universell utforming**: Tilgjengelig for alle elever, med dark mode, light mode og UU-modus
- **GDPR-compliant**: All elevdata i EU, zero data retention på LLM-kall

---

## 2. Målgruppe og brukere

### 2.1 Ved lansering (MVP)

| Bruker | Antall | Beskrivelse |
|--------|--------|-------------|
| **Elever** | ~50 | VGS-elever på prosjekteiers skole |
| **Lærer** | 1 | Prosjekteier (admin + lærer + kvalitetssikrer) |

### 2.2 Fremtidig skalering

| Fase | Brukere | Endring |
|------|---------|---------|
| Fase 2 | ~200-500 | Flere lærere på samme skole |
| Fase 3 | ~1 000-5 000 | Andre skoler, Feide-integrasjon |
| Fase 4 | ~10 000+ | Nasjonal utrulling, freemium-modell |

### 2.3 Brukerroller

| Rolle | Tilganger |
|-------|-----------|
| **Elev** | Wiki, chat-tutor, oppgaver, øvingsprøver (generering + utskrift), fremgangsprofil, flashcards |
| **Lærer** | Alt elev har + dashboard, prøvegenerering, retting, elevrapporter, notater, pensumreview |
| **Admin** | Alt lærer har + pensumgenerering, systemoversikt, brukeradministrasjon |

---

## 3. Faglig dekning

### 3.1 Fag ved lansering

**R1** (Matematikk R1) — komplett pensum med alle kompetansemål.

### 3.2 Planlagte fag

| Prioritet | Fag | Data tilgjengelig |
|-----------|-----|-------------------|
| 1 | R1 | Ja — pensum + eksamen |
| 2 | R2 | Ja — pensum + eksamen |
| 3 | 1T | Ja — pensum + eksamen |
| 4 | 1P | Ja — pensum + eksamen |
| 5 | 2P | Ja — pensum + eksamen |
| 6+ | S1, S2, 2P-Y | Ikke ennå |

### 3.3 Kompetansemål som styringsmekanisme

Hvert innholdselement i systemet (teori, regler, eksempler, oppgaver) tagges med kompetansemål fra læreplanen. Kompetansemålene danner grunnlaget for:
- Strukturering av pensum
- Prøvegenerering
- Elevprofilering og fremgangsrapportering
- Differensiering på tvers av fag

---

## 4. Produktarkitektur — Oversikt

```
┌─────────────────────────────────────────────────────────────┐
│                        YpsiMath OS                          │
├────────────┬────────────┬──────────────┬───────────────────┤
│   Wiki     │  Chat-     │  Prøve-      │  Lærer-           │
│   Visning  │  Tutor     │  system      │  Dashboard        │
├────────────┴────────────┴──────────────┴───────────────────┤
│                    Elevprofil & Fremgang                     │
├─────────────────────────────────────────────────────────────┤
│              RAG Engine (Hybrid Search + RRF)                │
├─────────────────────────────────────────────────────────────┤
│         AI-generert Pensum (Content Layer)                   │
├────────────┬────────────┬──────────────┬───────────────────┤
│ Supabase   │ Vercel AI  │ Manim        │ Cloudflare R2     │
│ (EU-FRA)   │ Gateway    │ Pipeline     │ (Video CDN)       │
└────────────┴────────────┴──────────────┴───────────────────┘
```

---

## 5. Funksjonelle krav

### 5.1 Pensum-generering (Content Pipeline)

#### 5.1.1 Formål
Generere nytt, originalt matematikkpensum basert på kompetansemål, eksisterende pensum og tidligere eksamener via LLM + RAG. Det genererte pensumet unngår copyright-problematikk ved å være nyskrevet, ikke kopiert.

#### 5.1.2 Kilde-RAG-database
- **Input**: Eksisterende pensum (HTML fra Unibok via SingleFile), tidligere eksamener (PDF), kompetansemål
- **Formål**: Gi LLM kontekst om pedagogisk tradisjon, norsk notasjon, oppgavetyper og vanskelighetsgrad
- **Viktig**: Denne databasen brukes kun internt for generering. Innholdet serveres aldri direkte til brukere. (Kun intern bruk.)

#### 5.1.3 Genereringsflyt

```
Kompetansemål + Kilde-RAG → LLM (Claude Opus 4.6) → Nytt pensum
                                                          ↓
                                                   Kvalitetssikring
                                                   (Admin review)
                                                          ↓
                                                   Produksjons-RAG
                                                   (Elevvendt)
```

#### 5.1.4 Innholdstyper som genereres

| Type | Beskrivelse | Eksempel |
|------|-------------|---------|
| **Teori** | Forklarende tekst med pedagogisk oppbygging | Innføring i derivasjon |
| **Regel** | Formell definisjon, teorem eller formel | Kjerneregelen: $(f(g(x)))' = f'(g(x)) \cdot g'(x)$ |
| **Eksempel** | Gjennomarbeidet løsning med steg-for-steg | Deriver $f(x) = \ln(x^2 + 1)$ |
| **Oppgave** | Øvingsoppgave med fasit og hint | Finn $f'(x)$ når $f(x) = e^{3x} \cdot \sin(x)$ |
| **Utforskning** | Interaktiv visualisering med Mafs/JSXGraph | Dra tangentlinjen langs en kurve |
| **Video** | Manim-generert gjennomgang av eksempler | Animert derivasjon av sammensatte funksjoner |
| **Flashcard** | Begrep + definisjon for puggemodus | Hva er en kritisk punkt? |

#### 5.1.5 Krav til generert pensum

- **Norsk notasjon**: Komma som desimaltegn, norske fagtermer, konvensjoner fra kildematerialet
- **LaTeX**: Inline `$...$` og display `$$...$$` med KaTeX-kompatibel syntaks
- **Tredobbelt tilnærming**: Hvert relevant tema dekkes med håndregning, GeoGebra og Python
- **Progressiv avsløring**: Minimalvisning med mulighet for å utvide (beviser, utdypninger, alternativ tilnærming)
- **Kompetansemål-tagging**: Hvert innholdselement tagges med relevante kompetansemål
- **LLM-optimalisert struktur**: Korte, presise definisjoner, tydelig tagging, semantisk meningsfull oppdeling

#### 5.1.6 Kvalitetssikring

- **Admin-dashboard for review**: Admin ser generert innhold side-for-side med kildemateriale
- **LLM-basert flagging**: En separat LLM-kjøring evaluerer generert innhold og flagger elementer som trenger ekstra menneskelig gjennomgang (matematiske feil, uklare formuleringer, manglende steg)
- **Status per innholdselement**: `draft → flagged → reviewed → published`
- **Versjonering**: Alle endringer logges slik at man kan rulle tilbake

### 5.2 Wiki-visning

#### 5.2.1 Formål
Presentere pensum som en interaktiv, progressiv wiki der elevene kan utforske matematikk i eget tempo.

#### 5.2.2 Krav

- **Lineær navigasjon**: Semesterplan-basert rekkefølge av temaer (MVP)
- **Fremtidig nettverksnavigasjon**: Temaer som noder i et nettverk, elever "unlocker" nye temaer
- **Progressiv avsløring**: Kollapserbare seksjoner for beviser, utdypninger, alternative tilnærminger
- **LaTeX-rendering**: KaTeX for all matematisk notasjon
- **Kodeblokker**: Pyodide-runtime for Python-kode (les, manipuler, skriv — avhengig av fag)
- **Interaktive visualiseringer**: Mafs-baserte utforskningskomponenter (dra punkter, juster parametere)
- **GeoGebra-embeds**: For oppgaver som krever GeoGebra-verktøy
- **Manim-videoer**: Forhåndsgenererte videogjennomganger av eksempler
- **Responsivt design**: Optimalisert for MacBook Air (primær), nettbrett, mobil (flashcards)
- **PWA/Offline**: Wiki-innhold tilgjengelig uten nett (fremtidig, for eksamenssituasjoner)

#### 5.2.3 Planet-reisen (Gamification)

- **Lineær reise i MVP**: Temaer presentert som "planeter" langs en sti, bestemt av semesterplanen
- **Candy Crush-inspirert**: 2D-visualisering, profesjonell og ren — ikke "tacky"
- **Unlock-mekanikk**: Fremgang synliggjøres visuelt, fullførte temaer markeres
- **Fremtidig**: Nettverk av temaer med forgreninger, individuelle læringsløp

#### 5.2.4 Oppgavesjekk (Hybrid)

Oppgavesjekk bruker en hybrid tilnærming som balanserer lav friksjon med rik tilbakemelding:

**Standardflyt (alle oppgaver):**
1. Eleven jobber med oppgaven (på papir, i hodet, i GeoGebra/Python)
2. Valgfritt: Klikk **"Vis hint"** (stegvis, teller i profilen)
3. Klikk **"Vis fasit"** → kollapserbar steg-for-steg løsning åpnes
4. Eleven selvrapporterer: ✅ Fikk til / 🔄 Delvis / ❌ Fikk ikke til

**Valgfri bildeopplasting:**
- Etter å ha sett fasiten: **"Sjekk utregningen min"** (📷) → ta bilde av utregning
- Gemini 3 Flash analyserer og gir detaljert tilbakemelding på hvor det gikk galt
- Rikere feilanalyse lagres i elevprofilen

**Automatisk sjekk (der mulig):**
- Flervalgsoppgaver: Klikk-basert, automatisk sjekk
- Numerisk svar: Eleven taster inn et tall, sjekkes mot fasit (med toleranse)
- Dra-og-slipp / interaktiv: Automatisk sjekk mot løsning
- Disse oppgavetypene gir pålitelig mestringsdata uten friksjon

**Vekting i elevprofil:**
- Selvrapportering vektes lavt (upålitelig)
- Automatisk sjekk vektes middels
- Bildeopplasting vektes middels-høyt
- Prøveretting vektes høyest

```
Eleven gjør oppgave
       ↓
  "Vis hint" (valgfritt, teller i profilen)
       ↓
  "Vis fasit"
       ↓
  ┌─────────────────────────────────┐
  │  ✅ Fikk til                    │
  │  🔄 Delvis                      │
  │  ❌ Fikk ikke til               │
  │                                 │
  │  📷 Sjekk utregningen min      │
  │     (valgfritt — ta bilde)      │
  └─────────────────────────────────┘
       ↓
  Elevprofil oppdateres (vektet)
```

### 5.3 Chat-tutor

#### 5.3.1 Formål
En AI-drevet matematikk-tutor som har RAG-tilgang på det genererte pensumet og kan differensiere basert på elevens profil.

#### 5.3.2 Krav

- **RAG på produksjonspensum**: Hybrid søk (vektor + fulltekst + RRF) på det kvalitetssikrede pensumet
- **Tverrfaglig tilgang**: LLM har kontekst fra alle fag — kan referere til R2-konsepter for sterke R1-elever, og gi støtteoppgaver fra 1T uten å nevne at det er 1T
- **Elevprofilbevisst**: Tilpasser forklaringer, vanskelighetsgrad og eksempler basert på elevens profil
- **Pedagogisk adferd**: Gir ikke hele løsningen med en gang — veileder steg for steg
- **Bildeanalyse**: Eleven kan ta bilde av en oppgave eller utregning og få hjelp
- **Norsk**: All kommunikasjon på norsk med korrekt matematisk terminologi
- **LaTeX i svar**: KaTeX-rendering av all matematikk i chat-svar
- **Kildehenvisning**: Svar refererer til relevante pensum-seksjoner
- **Streaming**: Token-for-token streaming for god brukeropplevelse

#### 5.3.3 Differensieringslogikk

```
Elevprofil (mestrede temaer, vanskeligheter, mål)
         ↓
System-prompt kontekstualisering
         ↓
RAG-søk på tvers av fag (R1, R2, 1T, ...)
         ↓
LLM genererer tilpasset svar
```

### 5.4 Elevprofil og fremgang

#### 5.4.1 Formål
Bygge en rik profil av hver elev som muliggjør adaptiv læring og gir læreren innsikt.

#### 5.4.2 Profildata

| Kategori | Data | Kilde |
|----------|------|-------|
| **Mestring** | Mestrede/ikke-mestrede kompetansemål | Oppgaveløsning, prøver, chat-interaksjon |
| **Tempo** | Tid brukt per tema, gjennomsnittlig oppgavetid | Aktivitetslogg |
| **Feilmønstre** | Typiske feil (fortegnsfeil, algebraisk forenkling, etc.) | Prøveretting, oppgavesjekk |
| **Læringsstil** | Foretrekker visuelt, algebraisk, numerisk | Bruksmønster (video vs tekst vs kode) |
| **Mål** | Elevdefinerte mål (karakter, emner å forbedre) | Manuell input |
| **Styrker** | Temaer med konsekvent høy mestring | Aggregert fra oppgaver/prøver |
| **Aktivitet** | Innlogginger, tid i systemet, interaksjoner | Automatisk logging |

#### 5.4.3 Fremgangsvisning for elev

- **Planet-kart**: Visuell oversikt over reisen gjennom pensum
- **Kompetansemål-oversikt**: Rød/gul/grønn status per kompetansemål
- **Statistikk**: Antall oppgaver løst, tid brukt, forbedring over tid
- **Anbefalinger**: AI-genererte forslag til hva eleven bør jobbe med videre

### 5.5 Prøvesystem

#### 5.5.1 Prøvegenerering

- **Lærer definerer**: Total varighet, varighet Del 1 vs Del 2, temaer, vanskelighetsgrad
- **AI genererer**: Basert på definerte parametere + eksamenshistorikk i RAG-databasen
- **Standardformat**: Del 1 (uten hjelpemidler) + Del 2 (med hjelpemidler)
- **Tidsanslag**: Modellen anslår antall oppgaver basert på eksamensformatet (5 timer = referanse)
- **Beregning**: Lærer oppgir total tid → systemet beregner forholdsmessig antall oppgaver
- **Elevgenererte prøver**: Elever kan generere egne øvingsprøver for forberedelse

#### 5.5.2 Prøveformat (utskrift på papir)

Prøver gjennomføres **på papir**, ikke digitalt. Håndskrevne besvarelser gir rik informasjon om elevens tankegang, mellomregning og fremgangsmåte som går tapt i digitale prøver.

- **PDF-eksport**: Prøve rendres som HTML med KaTeX, deretter konvertert til PDF via Puppeteer (headless Chrome) for pikselpresis LaTeX-rendering
- **Del 1 og Del 2**: Separate PDF-seksjoner med tydelig markering
- **Fasit-PDF**: Separat PDF med fullstendige løsninger og vurderingskriterier (kun for lærer)
- **Elevspesifikke øvingsprøver**: Elever kan generere og skrive ut egne øvingsprøver

#### 5.5.3 Prøveretting (skannet)

- **Input**: PDF med skannede elevbesvarelser, sortert per elev
- **OCR + analyse**: Gemini 3 Flash leser håndskrevne og digitale besvarelser
- **Vurdering**: LLM (GPT-5) vurderer mot fasit og vurderingskriterier
- **Output per elev**:
  - Prosentpoeng per oppgave og totalt
  - Feilanalyse: Hva slags feil gjør eleven (fortegnsfeil, konseptfeil, regnefeil, etc.)
  - Konfidensscoring: LLM oppgir hvor sikker den er på sin vurdering (0-100%)
  - Rapport: Sammenfattende vurdering av elevens prestasjon
- **Viktig**: Systemet setter IKKE karakter — det gir informasjonsgrunnlag for at læreren skal sette karakter

#### 5.5.4 Bildebasert hjelp (daglig bruk)

- **Ta bilde av oppgave**: Få løsningsforslag eller hint
- **Ta bilde av utregning**: Få tilbakemelding på fremgangsmåte og eventuelle feil
- **Modell**: Gemini 3 Flash for bildeanalyse, chat-modell for respons

### 5.6 Lærer-dashboard

#### 5.6.1 Oversikt

- **Klasseoversikt**: Alle elevers fremgang i en kompakt visning
- **Heatmap**: Kompetansemål-mestring per elev (rød/gul/grønn matrise)
- **Varsler**: Elever som henger etter, uvanlige mønstre, flagget innhold

#### 5.6.2 Per elev

- **Profil**: All profildata fra 5.4.2
- **Prøveresultater**: Historikk med detaljerte rapporter
- **Chat-aktivitet**: Oversikt (ikke innhold) over chat-bruk
- **Notater**: Fritekst-notatfelt for læreren per elev
- **Vurderingsrapport**: AI-generert årsrapport basert på all data, som grunnlag for karaktersetting

#### 5.6.3 Prøveadministrasjon

- **Opprett prøve**: Definer parametere, generer, rediger, eksporter PDF for utskrift
- **Rett prøve**: Last opp skannet PDF, kjør AI-retting, gjennomgå resultater
- **Resultater**: Per elev og samlet klassestatistikk

#### 5.6.4 Pensum-review (Admin)

- **Innholdsoversikt**: Status per innholdselement (draft/flagged/reviewed/published)
- **Side-by-side**: Generert innhold vs kildemateriale
- **Rediger**: Inline-redigering av generert innhold
- **Flagg-kø**: AI-flaggede elementer som trenger gjennomgang

### 5.7 Flashcards og puggemodus

- **Begreper**: Auto-genererte flashcards fra pensum (begrep → definisjon)
- **Formler**: Formel-flashcards med hint og forklaring
- **Spaced repetition**: Algoritme (SM-2 eller lignende) for optimalt puggintervall
- **Mobilvennlig**: Primær bruksmodus på mobil
- **Swipe-interaksjon**: Sveip for "kan" / "kan ikke" / "usikker"

### 5.8 Semesterplan

#### 5.8.1 Formål
Gi læreren et verktøy for å fordele pensum over skoleåret, og gi elevene en tydelig tidsplan for læringsløpet. Semesterplanen styrer rekkefølgen i wiki-visningen og planet-reisen.

#### 5.8.2 Innholdsstruktur

Pensum er strukturert slik at hvert **undertema** tilsvarer én undervisningsøkt à 45 minutter. Alle undertemaer i et fag utgjør den totale mengden som skal fordeles over året.

#### 5.8.3 Oppsett av semesterplan

Lærer konfigurerer følgende (via chat-grensesnitt eller manuelt skjema — lavest mulig friksjon):

1. **Startdato og sluttdato** for skoleåret
2. **Timeplan**: Hvilke ukedager og klokkeslett det er mattetimer, og hvor lange de er
3. **Feriedager og helligdager**: Offentlige helligdager (auto-importert for Norge), høstferie, vinterferie, påskeferie, planleggingsdager, egne fridager
4. **Årshjul-hendelser**: Ekskursjoner, fagdager, tentamenperioder og annet som tar timer
5. **Vurderinger**: Antall og type vurderingssituasjoner (heldagsprøve, halvdagsprøve, kortprøve) plassert i semesterplanen
6. **Tema-rekkefølge**: Standard anbefalt rekkefølge (basert på avhengigheter mellom temaer), med mulighet for å endre via dra-og-slipp

#### 5.8.4 Generering

Basert på konfigurasjon over:
- Systemet beregner totalt antall tilgjengelige undervisningsøkter
- Undertemaer (à 45 min) fordeles jevnt over tilgjengelige økter
- Vurderinger plasseres der læreren har definert dem
- Repetisjonstimer legges inn automatisk før prøver (konfigurerbart antall)
- Resultatet vises som visuell kalendervisning og som tabell

#### 5.8.5 Justering

- **Dra-og-slipp**: Flytt temaer og vurderinger i kalenderen
- **Chat-basert**: "Flytt vektorer til etter jul" → systemet oppdaterer planen
- **Automatisk rekalkulering**: Når timer legges til/fjernes, rebalanseres planen
- **Versjonering**: Tidligere versjoner av semesterplanen lagres

#### 5.8.6 Elevvisning

- Elevene ser semesterplanen som en tidslinje integrert med planet-reisen
- Neste tema er alltid synlig med dato
- Progresjon vises relativt til semesterplanen ("du er i rute" / "du ligger foran" / "du henger etter")

---

## 6. Ikke-funksjonelle krav

### 6.1 Ytelse

| Metrikk | Krav |
|---------|------|
| Chat-respons (TTFT) | < 1 sekund |
| Wiki-sidelasting | < 2 sekunder |
| Søk i pensum | < 500 ms |
| Prøveretting (50 elever) | < 30 minutter |
| Lighthouse-score | > 90 (alle kategorier) |

### 6.2 Tilgjengelighet

- **WCAG 2.1 AA** som minimumskrav
- **Dark mode**: Standard mørkt tema, behagelig for langvarig bruk
- **Light mode**: Lyst tema som alternativ
- **UU-modus**: Forstørret tekst, høykontrast, forenklet layout, skjermleser-støtte
- **Tastaturnavigasjon**: Full funksjonalitet uten mus
- **Matematikk-tilgjengelighet**: KaTeX med ARIA-attributter, Mafs med keyboard-navigerbare punkter

### 6.3 Sikkerhet og personvern

| Krav | Implementasjon |
|------|----------------|
| **GDPR** | All data i EU (Supabase Frankfurt) |
| **ZDR** | Zero Data Retention på alle LLM-kall |
| **RLS** | Row Level Security på alle tabeller med brukerdata |
| **Auth** | E-post + passord (MVP), Feide-klar arkitektur |
| **Mindreårige** | Foreldresamtykke-flyt for elever under 16 |
| **DPIA** | Gjennomføres før lansering |
| **DPA** | Signeres med alle databehandlere (Supabase, Google, Vercel) |
| **Kryptering** | TLS i transit, AES-256 at rest (via Supabase) |
| **Bildeopplasting** | Scoped til brukerens egen mappe, maks 10 MB |
| **Rate limiting** | Per bruker, per endepunkt |

### 6.4 Skalerbarhet

- **50 brukere**: Supabase Free/Pro, enkelt Vercel-deploy
- **1 000 brukere**: Supabase Pro, caching-lag, CDN for video
- **10 000+ brukere**: Supabase Team, edge functions, video-CDN, vurder read replicas

### 6.5 Design og UX

- **Rolig og profesjonelt**: Ikke "edtech-glossy" — seriøst og inviterende
- **Utholdenhet**: Designet for langvarig bruk uten øyeslitasje
- **Konsistent**: Designsystem med Tailwind CSS + shadcn/ui som base
- **Responsivt**: MacBook Air (primær) → nettbrett → mobil (flashcards)
- **Norsk UI**: All tekst, navigasjon og systemmelding på norsk

---

## 7. Teknisk arkitektur

### 7.1 Tech Stack

| Lag | Teknologi | Begrunnelse |
|-----|-----------|-------------|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript | Server Components, streaming, etablert i prosjekteiers erfaring |
| **Styling** | Tailwind CSS + shadcn/ui | Konsistent designsystem, rask utvikling, dark/light/UU-modus |
| **Matematikk** | KaTeX (rendering), Mafs (2D viz), JSXGraph (avansert), React Three Fiber (3D) | Se avsnitt 7.3 |
| **Python i nettleser** | Pyodide | Full CPython i nettleser, ingen server-avhengighet |
| **GeoGebra** | Embedded applets | For oppgaver som krever GeoGebra-verktøy |
| **Database** | Supabase (PostgreSQL + pgvector + Auth + Realtime + Storage) | Alt-i-ett, EU Frankfurt, RLS, Feide-klar |
| **ORM** | Drizzle ORM eller Prisma | Type-safe database-tilgang, migrasjoner |
| **Validering** | Zod | Runtime-validering av all input |
| **LLM Gateway** | Vercel AI Gateway (ZDR) for alle LLM-kall | GDPR, ZDR, kostnadskontroll, modell-agnostisk |
| **PDF-generering** | Puppeteer (headless Chrome) | HTML+KaTeX → PDF, pikselkontroll, server-side rendering |
| **Video** | Manim CE (forhåndsgenerering), GSAP (in-app animasjoner) | Se avsnitt 7.4 |
| **Hosting** | Vercel (frontend), Supabase (backend), CDN (video) | Auto-deploy fra GitHub |
| **Testing** | Vitest (unit), Playwright (E2E) | Rask, moderne testsuite |

### 7.2 Databaseskjema (konseptuelt)

#### Brukerdata

```
profiles
  id: UUID (FK auth.users)
  email: TEXT
  display_name: TEXT
  role: ENUM (student, teacher, admin)
  auth_provider: TEXT (email, feide, ...)
  provider_user_id: TEXT
  school_org_id: TEXT
  settings: JSONB (theme, accessibility prefs)
  created_at: TIMESTAMPTZ

student_profiles
  id: UUID (FK profiles)
  current_subject: TEXT
  goals: JSONB
  learning_style_prefs: JSONB
  mastered_competency_goals: TEXT[]
  struggling_competency_goals: TEXT[]
  total_exercises_completed: INT
  total_time_spent_minutes: INT

classes
  id: UUID
  name: TEXT (f.eks. "R1 - 3STA")
  subject_id: TEXT (FK subjects)
  teacher_id: UUID (FK profiles)
  school_year: TEXT (f.eks. "2026-2027")
  created_at: TIMESTAMPTZ

class_memberships
  id: UUID
  class_id: UUID (FK classes)
  student_id: UUID (FK profiles)
  enrolled_at: TIMESTAMPTZ
```

#### Innhold

```
subjects
  id: TEXT (r1, r2, 1t, 1p, 2p)
  name: TEXT
  description: TEXT
  competency_goals: JSONB

content_elements
  id: UUID
  subject_id: TEXT (FK subjects)
  chapter: TEXT
  topic: TEXT
  sort_order: INT (rekkefølge innenfor topic)
  content_type: ENUM (theory, rule, example, exercise, exploration, flashcard)
  exercise_format: ENUM (freeform, multiple_choice, numeric_input, drag_drop, interactive) NULL
  content: TEXT (Markdown + LaTeX)
  content_metadata: JSONB (difficulty, prerequisites, hints, answer, choices, tolerance)
  competency_goals: TEXT[]
  status: ENUM (draft, flagged, reviewed, published)
  version: INT
  embedding: VECTOR(1536)
  fts: TSVECTOR
  created_at: TIMESTAMPTZ
  updated_at: TIMESTAMPTZ
  reviewed_by: UUID (FK profiles)
  reviewed_at: TIMESTAMPTZ

content_versions
  id: UUID
  content_element_id: UUID (FK content_elements)
  version: INT
  content: TEXT
  changed_by: UUID (FK profiles)
  changed_at: TIMESTAMPTZ
  change_note: TEXT

videos
  id: UUID
  content_element_id: UUID (FK content_elements)
  video_url: TEXT
  thumbnail_url: TEXT
  duration_seconds: INT
  manim_script: TEXT
  status: ENUM (generating, ready, failed)
```

#### Semesterplan

```
semester_plans
  id: UUID
  class_id: UUID (FK classes)
  subject_id: TEXT (FK subjects)
  start_date: DATE
  end_date: DATE
  schedule: JSONB (ukedager, klokkeslett, varigheter)
  holidays: JSONB (offentlige helligdager, ferier, egne fridager)
  version: INT
  created_at: TIMESTAMPTZ
  updated_at: TIMESTAMPTZ

semester_plan_entries
  id: UUID
  semester_plan_id: UUID (FK semester_plans)
  date: DATE
  entry_type: ENUM (topic, assessment, revision, holiday, event)
  topic: TEXT NULL (refererer til content_elements topic)
  assessment_type: ENUM (full_day_exam, half_day_exam, short_quiz) NULL
  exam_id: UUID NULL (FK exams)
  title: TEXT (visningsnavn i kalenderen)
  sort_order: INT
  duration_minutes: INT

semester_plan_versions
  id: UUID
  semester_plan_id: UUID (FK semester_plans)
  version: INT
  snapshot: JSONB (full kopi av plan-state)
  changed_at: TIMESTAMPTZ
  change_note: TEXT
```

#### Chat og interaksjon

```
conversations
  id: UUID
  user_id: UUID (FK profiles)
  title: TEXT
  subject_context: TEXT
  created_at: TIMESTAMPTZ
  updated_at: TIMESTAMPTZ

messages
  id: UUID
  conversation_id: UUID (FK conversations)
  role: ENUM (user, assistant, system)
  content: TEXT
  sources: JSONB
  image_url: TEXT
  created_at: TIMESTAMPTZ
```

#### Prøver og vurdering

```
exams
  id: UUID
  created_by: UUID (FK profiles)
  title: TEXT
  subject_id: TEXT (FK subjects)
  total_duration_minutes: INT
  part1_duration_minutes: INT
  part2_duration_minutes: INT
  competency_goals: TEXT[]
  exam_pdf_url: TEXT (utskriftsvennlig prøve-PDF)
  solution_pdf_url: TEXT (fasit-PDF, kun for lærer)
  status: ENUM (draft, ready, completed)
  created_at: TIMESTAMPTZ

exam_questions
  id: UUID
  exam_id: UUID (FK exams)
  part: INT (1 or 2)
  question_number: INT
  content: TEXT (Markdown + LaTeX)
  max_points: DECIMAL
  solution: TEXT
  grading_criteria: TEXT

exam_submissions
  id: UUID
  exam_id: UUID (FK exams)
  student_id: UUID (FK profiles)
  scanned_at: TIMESTAMPTZ
  scan_pdf_url: TEXT
  total_score_percent: DECIMAL
  status: ENUM (scanned, grading, graded, reviewed)

exam_answers
  id: UUID
  submission_id: UUID (FK exam_submissions)
  question_id: UUID (FK exam_questions)
  student_answer_text: TEXT (OCR-uttrukket)
  score_percent: DECIMAL
  error_analysis: JSONB
  confidence_score: DECIMAL (0-100)
  llm_feedback: TEXT

teacher_notes
  id: UUID
  teacher_id: UUID (FK profiles)
  student_id: UUID (FK profiles)
  content: TEXT
  created_at: TIMESTAMPTZ
  updated_at: TIMESTAMPTZ
```

#### Fremgang og aktivitet

```
activity_log
  id: UUID
  user_id: UUID (FK profiles)
  activity_type: ENUM (wiki_view, exercise_attempt, chat_message, exam_graded, video_watched, flashcard_session)
  subject_id: TEXT
  topic: TEXT
  competency_goals: TEXT[]
  metadata: JSONB
  duration_seconds: INT
  created_at: TIMESTAMPTZ

exercise_attempts
  id: UUID
  user_id: UUID (FK profiles)
  content_element_id: UUID (FK content_elements)
  check_method: ENUM (self_report, auto_check, image_check)
  self_report: ENUM (correct, partial, incorrect) NULL
  auto_result: BOOLEAN NULL
  answer: TEXT NULL
  image_url: TEXT NULL (bilde av utregning)
  image_feedback: TEXT NULL (LLM-tilbakemelding på bilde)
  hints_used: INT DEFAULT 0
  viewed_solution: BOOLEAN DEFAULT false
  time_seconds: INT
  created_at: TIMESTAMPTZ

flashcard_progress
  id: UUID
  user_id: UUID (FK profiles)
  content_element_id: UUID (FK content_elements)
  ease_factor: DECIMAL (SM-2)
  interval_days: INT
  repetitions: INT
  next_review: DATE
  last_reviewed: TIMESTAMPTZ
```

### 7.3 Visualiseringsarkitektur

```
┌─────────────────────────────────────────────────┐
│              Visualiseringslag                    │
├──────────┬──────────┬──────────┬────────────────┤
│  Mafs    │ JSXGraph │   R3F    │   GeoGebra     │
│  (2D     │ (Avansert│  (3D     │   (Embedded    │
│  primær) │ kalkulus)│  viz)    │   oppgaver)    │
├──────────┴──────────┴──────────┴────────────────┤
│     GSAP (In-app steg-for-steg animasjoner)      │
├─────────────────────────────────────────────────┤
│     D3.js utilities (statistikk, sannsynlighet)  │
└─────────────────────────────────────────────────┘
```

| Bibliotek | Bruksområde | Laste-strategi |
|-----------|-------------|----------------|
| **Mafs** | Funksjonsplotting, tangentlinjer, vektorpiler, arealer | Alltid lastet (160 kB) |
| **JSXGraph** | Riemann-summer, slopefelt, geometriske konstruksjoner | Lazy-load ved behov |
| **React Three Fiber** | 3D-vektorer, flater, romgeometri | Lazy-load ved behov |
| **GeoGebra** | Spesifikke oppgaver som krever GeoGebra | Iframe-embed ved behov |
| **GSAP** | Animere liknings-transformasjoner, graf-overganger | Alltid lastet (liten) |
| **D3.js** | Normalfordeling, binomialfordeling, statistiske diagrammer | Lazy-load (tree-shaken) |

### 7.4 Videopipeline (Manim)

```
Innholdselement (eksempel)
         ↓
Claude Sonnet 4.6 genererer Manim-script
         ↓
Rendering i separat pipeline (GitHub Actions / dedikert server)
         ↓
MP4 → CDN (Vercel Blob / Supabase Storage / Cloudflare R2)
         ↓
Video-URL lagres i videos-tabellen
         ↓
Vises i wiki som embedded video
```

- **Rendering**: Manim CE med Python 3.12+ og ffmpeg
- **Kvalitetskontroll**: Generert video vurderes manuelt eller av LLM (screenshot-analyse)
- **Fallback**: Ved feil i Manim-script, sendes error tilbake til LLM for korreksjon (inntil 3 forsøk)

### 7.5 LLM-routing

| Bruk | Modell | Gateway | GDPR-nivå |
|------|--------|---------|-----------|
| Pensumgenerering | Claude Opus 4.6 | Vercel AI Gateway (ZDR) | Ingen elevdata |
| Kvalitetsflagging | Claude Sonnet 4.6 | Vercel AI Gateway (ZDR) | Ingen elevdata |
| Elevchat (RAG) | Gemini 3 Flash (eller annen — bestemmes senere) | Vercel AI Gateway (ZDR) | Elevdata, GDPR-kritisk |
| Bildeanalyse | Gemini 3 Flash | Vercel AI Gateway (ZDR) | Elevdata, GDPR-kritisk |
| Prøveretting | GPT-5 | Vercel AI Gateway (ZDR) | Elevdata, GDPR-kritisk |
| Manim-scripts | Claude Sonnet 4.6 | Vercel AI Gateway (ZDR) | Ingen elevdata |
| Vurderingsrapport | Claude Opus 4.6 | Vercel AI Gateway (ZDR) | Elevdata (aggregert) |
| Embedding | OpenAI text-embedding-3-small | Vercel AI Gateway | Pensum-tekst, ingen elevdata |

**Merk**: Modellvalg for elevvendt chat holdes åpent — evalueres basert på norsk kvalitet, pris og GDPR-status ved implementasjon. Modeller endres raskt og dette vurderes løpende.

### 7.6 RAG-arkitektur

```
Bruker-spørring
      ↓
Embedding (text-embedding-3-small, 1536d)
      ↓
┌─────────────────────────────────┐
│   Hybrid Search i Supabase      │
│                                 │
│  Vektor-søk (HNSW, cosine)     │
│  +                              │
│  Fulltekst-søk (tsvector, nb)  │
│  =                              │
│  Reciprocal Rank Fusion (k=60) │
└─────────────────────────────────┘
      ↓
Top-K resultater (med metadata: fag, tema, type, kompetansemål)
      ↓
Kontekst-assembly + elevprofil + system-prompt
      ↓
LLM → Streaming respons med kildehenvisninger
```

**Tverrfaglig søk**: RAG-søket kjøres på tvers av alle fag i produksjons-databasen, men filtreres/vektes basert på elevens nåværende fag og profil.

---

## 8. Autentisering og brukeradministrasjon

### 8.1 MVP-auth

- **Registrering**: E-post + passord + bekreft passord (ingen e-postverifisering)
- **Innlogging**: E-post + passord
- **Sesjonshåndtering**: Supabase Auth med JWT via `@supabase/ssr`
- **Rolletildeling**: Admin oppretter lærere manuelt. Lærere kan legge inn egne elever, eller elever registrerer seg selv

### 8.2 Fremtidig auth

- **Feide (OIDC)**: Konfigurerbar som custom OIDC-provider i Supabase Auth
- **Skjema-klar**: `auth_provider`, `provider_user_id`, `school_org_id` i profiles-tabellen fra dag 1
- **Feide-attributter**: Rolle (elev/lærer), skole, klassetilhørighet mappes til interne roller

---

## 9. Faseinndeling

### Fase 0 — Fundament (4-6 uker)

**Mål**: Grunnleggende infrastruktur og arkitektur

- [ ] Next.js 15 prosjekt med TypeScript, Tailwind, shadcn/ui
- [ ] Supabase-oppsett i EU Frankfurt (auth, database, storage)
- [ ] Databaseskjema (migrasjoner) for alle kjernetabeller
- [ ] Auth-flyt (registrering, innlogging, rollebasert routing)
- [ ] Klasse- og elevadministrasjon (opprett klasse, legg til elever)
- [ ] Designsystem: fargepalett, typografi, dark/light/UU-modus
- [ ] CI/CD: GitHub → Vercel auto-deploy
- [ ] KaTeX-rendering pipeline
- [ ] Basis layout (navigasjon, sidebar, responsive shell)

### Fase 1 — Pensum-pipeline og Wiki (6-8 uker)

**Mål**: Generere og vise R1-pensum

- [ ] Kilde-RAG-database (fra Math-RAG pipeline, tilpasset)
- [ ] Pensum-genereringsscript (Claude Opus 4.6)
- [ ] Kvalitetssikrings-dashboard (admin review)
- [ ] Wiki-visning med alle innholdstyper
- [ ] Progressiv avsløring (kollapserbare seksjoner)
- [ ] Oppgavesjekk (hybrid: selvrapportering + vis fasit + valgfri bildeopplasting)
- [ ] Mafs-baserte interaktive visualiseringer (deriverte, funksjoner)
- [ ] Pyodide Python-runtime i pensum
- [ ] GeoGebra-embeds for relevante oppgaver
- [ ] Planet-reise (lineær versjon)
- [ ] Semesterplan-verktøy (oppsett, generering, kalendervisning)
- [ ] Semesterplan-integrasjon i wiki-navigasjon

### Fase 2 — Chat-tutor og elevprofil (4-6 uker)

**Mål**: Fungerende AI-tutor med elevtilpasning

- [ ] RAG-engine på produksjonspensum (hybrid search + RRF)
- [ ] Chat-interface med streaming og LaTeX
- [ ] Bildeanalyse (ta bilde av oppgave/utregning)
- [ ] Elevprofil-system (mestring, feilmønstre, mål)
- [ ] Tverrfaglig differensiering i chat
- [ ] Kildehenvisning i chat-svar
- [ ] Samtalehistorikk

### Fase 3 — Prøver og vurdering (4-6 uker)

**Mål**: Komplett prøve-workflow for lærer

- [ ] Prøvegenerering (lærer definerer parametere)
- [ ] PDF-eksport av prøver (utskriftsvennlig, del 1 + del 2 + fasit)
- [ ] PDF-opplasting av skannede besvarelser
- [ ] AI-retting med feilanalyse og konfidensscoring
- [ ] Elevgenererte øvingsprøver
- [ ] Resultatvisning per elev og klasse

### Fase 4 — Lærer-dashboard og rapporter (3-4 uker)

**Mål**: Komplett læreroversikt

- [ ] Klasseoversikt med heatmap
- [ ] Per-elev detaljvisning
- [ ] Notatfelt per elev
- [ ] AI-generert vurderingsrapport (årsrapport)
- [ ] Prøveadministrasjon i dashboard
- [ ] Pensum-review workflow i dashboard

### Fase 5 — Flashcards og video (3-4 uker)

**Mål**: Supplerende læringsverktøy

- [ ] Flashcard-generering fra pensum
- [ ] Spaced repetition (SM-2)
- [ ] Mobilvennlig flashcard-interface
- [ ] Manim video-pipeline (generering + rendering)
- [ ] Video-embedding i wiki

### Fase 6 — Polish og lansering (2-3 uker)

**Mål**: Produksjonsklar for 50 elever

- [ ] Ytelsesoptimalisering
- [ ] Tilgjengelighetstesting (WCAG 2.1 AA)
- [ ] DPIA gjennomført
- [ ] DPA signert med leverandører
- [ ] Brukertesting med testgruppe
- [ ] Feilretting og polish
- [ ] Dokumentasjon for elever og lærere

### Fremtidige faser

- **Fase 7**: Flere fag (R2, 1T, 1P, 2P)
- **Fase 8**: Feide-integrasjon
- **Fase 9**: Nettverksnavigasjon (ikke-lineær planet-reise)
- **Fase 10**: Freemium-modell og nasjonal utrulling
- **Fase 11**: PWA/offline-støtte

---

## 10. Suksesskriterier

### MVP (Fase 0-6)

| Kriterie | Målbart |
|----------|---------|
| R1-pensum komplett generert og kvalitetssikret | 100% av kompetansemål dekket |
| Elever bruker wiki aktivt | > 80% av elevene logger inn ukentlig |
| Chat-tutor gir korrekte svar | > 90% korrekthet på R1-spørsmål |
| Prøveretting sparer tid | > 50% tidsbesparelse vs manuell retting |
| Elever opplever systemet som nyttig | NPS > 30 |
| Ingen GDPR-brudd | 0 hendelser |

### Langsiktig

| Kriterie | Målbart |
|----------|---------|
| Alle VGS-mattefag dekket | 5+ fag |
| Målbar læringseffekt | Bedre eksamensresultater vs kontrollgruppe |
| Skalerbarhet | > 1 000 aktive brukere uten ytelsesforringelse |
| Kommersiell levedyktighet | Positiv enhetskostnad per bruker |

---

## 11. Risikofaktorer

| Risiko | Sannsynlighet | Konsekvens | Mitigering |
|--------|---------------|------------|------------|
| Matematiske feil i AI-generert pensum | Høy | Høy | Kvalitetssikrings-dashboard, LLM-flagging, manuell review |
| GDPR-brudd med elevdata | Lav | Svært høy | ZDR, EU-hosting, DPIA, DPA, RLS |
| LLM-modeller endres/avvikles | Middels | Middels | Modell-agnostisk arkitektur via Vercel AI Gateway |
| GeoGebra endrer lisensvilkår | Lav | Lav | Begrenset bruk, egne Mafs/JSXGraph-alternativer |
| Elever misbruker chat (juksing) | Middels | Middels | Pedagogisk prompt-design (veiledning, ikke fasit), aktivitetslogg |
| Skanning/OCR av håndskrift feiler | Middels | Middels | Konfidensscoring, manuell overprøving, to-pass analyse |
| Prosjektet er for stort for én person | Høy | Høy | Faseinndeling, AI-assistert utvikling, streng prioritering |
| Kostnader eskalerer | Lav | Middels | Kostnadsovervåking, modellbytte, caching |

---

## 12. Avgrensninger (hva YpsiMath IKKE er)

- **Ikke en LMS**: Ingen innleveringsmapper, fravær, timeplaner — dette håndteres av skolens LMS (Canvas, itslearning, etc.)
- **Ikke en kalkulator**: Systemet erstatter ikke GeoGebra eller Casio — det integrerer dem
- **Ikke automatisk karaktersetting**: Systemet gir informasjonsgrunnlag, læreren setter karakter
- **Ikke en generell AI-chat**: Fokus er matematikk i norsk VGS — ikke et generelt spørsmål-svar-system
- **Ikke et forlag**: Innholdet er AI-generert og kvalitetssikret av faglærer, ikke et tradisjonelt læreverk

---

## 13. Tekniske beslutninger — Logg

| Beslutning | Valg | Alternativ vurdert | Begrunnelse |
|------------|------|--------------------|-------------|
| Frontend-rammeverk | Next.js 15 | SvelteKit, Remix | Prosjekteiers erfaring, React-økosystem, Vercel-integrasjon |
| Database | Supabase (EU) | Neon, Hetzner self-hosted | Alt-i-ett (auth, db, realtime, vector, storage), GDPR |
| 2D-visualisering | Mafs (primær) | D3.js, p5.js | Beste React DX, MIT, lightweight, tilgjengelig |
| Avansert matte-viz | JSXGraph | — | Uslåelig kalkulus-dekning, akademisk |
| 3D-visualisering | React Three Fiber | MathBox, raw Three.js | Deklarativ React, lazy-load |
| Videogenerering | Manim CE | Motion Canvas, Remotion | Best LLM-kompatibilitet, native LaTeX, MIT |
| In-app animasjon | GSAP | Framer Motion | Ytelse, kontroll, gratis for dette bruk |
| Pensumgenerering | Claude Opus 4.6 | GPT-5, Gemini 2.5 Pro | Beste skrivekvalitet, sterk flerspråklig |
| Elevchat | Gemini 3 Flash (tentativt) | o4-mini, Claude Sonnet | Kosteffektiv, rask, ZDR via Vercel |
| OCR/bildeanalyse | Gemini 3 Flash | Gemini 2.5 Pro, GPT-5 | Multimodal, kosteffektiv |
| Prøveretting | GPT-5 | Claude Opus 4.6 | Høyest matematisk nøyaktighet |
| Manim-scripts | Claude Sonnet 4.6 | GPT-5, DeepSeek | Sterk kodegenerering, god Manim-kjennskap |
| Embedding-modell | text-embedding-3-small | Cohere, lokale modeller | Bevist i Math-RAG PoC, god norsk-støtte |
| Statistikk-viz | D3.js (utilities) | Chart.js | Tree-shakeable, norsk locale, fleksibel |
| GeoGebra | Embedded applets (begrenset) | Full integrasjon | Kommersiell lisens begrenser bruk |
| Spaced repetition | SM-2 algoritme | Anki-stil, Leitner | Enkel, velprøvd, åpen |
| PDF-generering | Puppeteer (headless Chrome) | @react-pdf/renderer, LaTeX→PDF | KaTeX rendres perfekt i Chrome, ingen separat LaTeX-installasjon |
| Prøveformat | Papir (PDF-utskrift) | Digital gjennomføring | Håndskrevne besvarelser gir rikere informasjon om elevens tankegang |

---

## 14. Ordliste

| Begrep | Definisjon |
|--------|-----------|
| **VGS** | Videregående skole (norsk gymnasnivå, 16-19 år) |
| **R1, R2** | Matematikk for realfag, nivå 1 og 2 |
| **1P, 2P** | Matematikk for påbygging, nivå 1 og 2 |
| **1T** | Matematikk for samfunnsfag/økonomi |
| **Kompetansemål** | Læringsmål definert i norsk læreplan (Kunnskapsløftet) |
| **Feide** | Felles Elektronisk IDEntitet — norsk utdannings-SSO |
| **ZDR** | Zero Data Retention — LLM-leverandør lagrer ikke forespørsler |
| **DPIA** | Data Protection Impact Assessment — GDPR-påkrevd risikovurdering |
| **DPA** | Data Processing Agreement — avtale med databehandler |
| **RLS** | Row Level Security — databasenivå tilgangskontroll |
| **RRF** | Reciprocal Rank Fusion — metode for å kombinere flere rangeringsresultater |
| **RAG** | Retrieval-Augmented Generation — hent relevant kontekst før LLM-generering |
| **SM-2** | SuperMemo 2 — algoritme for spaced repetition |
| **Manim** | Mathematical Animation — Python-bibliotek for mattevideoer |
| **Pyodide** | CPython kompilert til WebAssembly — Python i nettleseren |
| **KaTeX** | Rask LaTeX-rendering for web |
| **Mafs** | React-bibliotek for interaktive 2D-mattevisualiseringer |
| **GSAP** | GreenSock Animation Platform — profesjonelt web-animasjonsbibliotek |

---

## Appendiks A: Kompetansemål R1

| Kode | Kompetansemål |
|------|--------------|
| R1-01 | Planlegge og gjennomføre selvstendig arbeid med reelle datasett |
| R1-02 | Forstå vekstfart, grenser, deriverte, kontinuitet |
| R1-03 | Utforske og bestemme grenseverdier for funksjoner |
| R1-04 | Bestemme den deriverte i et punkt (geometrisk, algebraisk, numerisk) |
| R1-05 | Analysere funksjoner ved hjelp av den deriverte |
| R1-06 | Anvende derivasjon til å analysere matematiske modeller |
| R1-07 | Forstå potens- og logaritmeregler; løse eksponential- og logaritmeligninger |
| R1-08 | Modellere og analysere eksponentiell og logistisk vekst |
| R1-09 | Bestemme kontinuitet; gi eksempler på diskontinuerlige funksjoner |
| R1-10 | Utforske og utlede funksjoner og deres omvendte funksjoner |
| R1-11 | Anvende parameterframstilling for linjer |
| R1-12 | Forstå vektorer og vektoroperasjoner i planet |

---

## Appendiks B: Math-RAG PoC — Gjenbrukbar logikk

Følgende konsepter fra Math-RAG MVPen gjenbrukes i YpsiMath:

| Komponent | Gjenbrukbarhet | Tilpasning |
|-----------|---------------|------------|
| Chunk-skjema (topic, content_type, content, competency_goals) | Direkte | Utvides med status, versjon, metadata |
| Hybrid search (vektor + FTS + RRF) | Direkte | Tverrfaglig filtrering, profilvekting |
| KaTeX-pipeline (remark-math + rehype-katex) | Direkte | Ingen endring |
| Supabase RLS-policies | Template | Tilpasses nye tabeller |
| Embedding-pipeline | Logikk | Ny batch-prosess for generert pensum |
| Rate limiting | Pattern | Samme sliding window, nye grenser |
| System-prompt struktur | Konsept | Ny prompt med elevprofil-kontekst |
| Chat API (streaming) | Pattern | Utvides med profil og tverrfaglig RAG |

---

*Dokumentet er ment som grunnlag for task-breakdown og implementasjon. Alle tekniske valg er begrunnet med research utført februar 2026.*
