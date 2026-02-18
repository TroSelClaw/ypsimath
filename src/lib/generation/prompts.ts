/**
 * System and user prompts for content generation.
 */

export const R1_COMPETENCY_GOALS = [
  { code: 'R1-01', description: 'Utforske og beskrive egenskapane ved polynomfunksjonar, rasjonale funksjonar, eksponentialfunksjonar og potensfunksjonar' },
  { code: 'R1-02', description: 'Gjere greie for definisjonen av den deriverte, bruke definisjonen til å utleie ein derivasjonsregel og bruke denne til å drøfte funksjonar' },
  { code: 'R1-03', description: 'Gjere greie for den deriverte til potensfunksjonar, eksponentialfunksjonar, samansette funksjonar og implisitte funksjonar og bruke dette til å drøfte funksjonar' },
  { code: 'R1-04', description: 'Bruke førstederiverte og andrederiverte til å finne ekstremalpunkt, vendepunkt og krumming til funksjonar' },
  { code: 'R1-05', description: 'Modellere og analysere praktiske problemstillingar knytte til optimering' },
  { code: 'R1-06', description: 'Gjere greie for det bestemte integralet og bruke dette til å berekne areal av plane figurar' },
  { code: 'R1-07', description: 'Gjere greie for og bruke regnereglane for integrasjon til å finne antiderivert og berekne integral' },
  { code: 'R1-08', description: 'Bruke integrasjon til å berekne volum av omdreiingslekamar' },
  { code: 'R1-09', description: 'Bruke differensiallikningar i modellering' },
  { code: 'R1-10', description: 'Rekne med vektorar i to og tre dimensjonar, og bruke vektorar til å løyse geometriske problem' },
  { code: 'R1-11', description: 'Bruke vektorar til å beskrive rette linjer og plan i rommet og berekne avstandar, vinkel og areal' },
  { code: 'R1-12', description: 'Planleggje, gjennomføre og presentere eit sjølvstendig arbeid knytt til matematisk modellering' },
] as const;

export function buildSystemPrompt(): string {
  return `Du er en erfaren norsk matematikklærer som skriver innhold for en digital læringsplattform for R1-elever (videregående).

REGLER:
- Skriv alt på norsk bokmål
- Bruk KaTeX-kompatibel LaTeX-syntaks for alle matematiske uttrykk
- Inline matte: $...$, display matte: $$...$$
- Bruk komma som desimalskilletegn (f.eks. $2{,}5$)
- Bruk norske matematiske termer (derivert, integral, grenseverdi, osv.)
- Forklar trinn for trinn med tydelig pedagogisk progresjon
- Inkluder hint som hjelper eleven å tenke selv, uten å gi svaret direkte

INNHOLDSTYPER du kan generere:
1. theory: Forklarende teoritekst med eksempler
2. rule: Formelle regler/setninger i en boks-formatering
3. example: Gjennomgått eksempel med trinnvis løsning
4. exercise: Oppgave med hint, fasit og løsningsforslag
5. exploration: Utforskende aktivitet (kan inkludere Python-kode)
6. flashcard: Kort spørsmål-svar-par for repetisjon

OPPGAVEFORMATER:
- freeform: Fritekst-oppgave (selvrapportering)
- multiple_choice: Flervalg med 4 alternativer
- numeric: Numerisk svar med toleranse
- interactive: Interaktiv (dra-og-slipp e.l.)

KOMPETANSEMÅL R1:
${R1_COMPETENCY_GOALS.map((g) => `- ${g.code}: ${g.description}`).join('\n')}

Svar alltid i JSON-format som spesifisert i brukerens forespørsel.`;
}

export type ContentType = 'theory' | 'rule' | 'example' | 'exercise' | 'exploration' | 'flashcard';

export function buildGenerationPrompt(
  goalCode: string,
  contentType: ContentType | 'all',
  ragContext: string,
): string {
  const typeInstruction =
    contentType === 'all'
      ? 'Generer alle innholdstyper (theory, rule, example, exercise, flashcard) for dette kompetansemålet.'
      : `Generer innhold av typen "${contentType}" for dette kompetansemålet.`;

  return `Kompetansemål: ${goalCode}

${typeInstruction}

Relevant kildemateriale (bruk som kontekst, IKKE kopier direkte):
---
${ragContext}
---

Svar som et JSON-array med objekter. Hvert objekt skal ha:
{
  "content_type": "theory" | "rule" | "example" | "exercise" | "flashcard",
  "title": "Tittel på elementet",
  "content": "Markdown-innhold med LaTeX",
  "sort_order": <nummer>,
  "competency_goals": ["${goalCode}"],
  "content_metadata": {
    "difficulty": "beginner" | "intermediate" | "advanced",
    "prerequisites": ["kompetansemål-koder"],
    "hints": ["hint1", "hint2"],
    "answer": "fasit (for oppgaver)",
    "tolerance": 0.01,
    "exercise_format": "freeform" | "multiple_choice" | "numeric",
    "options": ["a)", "b)", "c)", "d)"],
    "solution_steps": ["steg 1", "steg 2"]
  }
}

Inkluder content_metadata-feltene som er relevante for hver type. For theory/rule trenger du ikke hints/answer.`;
}
