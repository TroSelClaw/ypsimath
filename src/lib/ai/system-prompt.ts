import type { SearchableContent } from '@/lib/rag/hybrid-search'
import type { RRFResult } from '@/lib/rag/rrf'

interface StudentContext {
  displayName: string
  currentSubject: string
  masteredGoals: string[]
  strugglingGoals: string[]
  targetGrade?: number
}

/**
 * Build the system prompt for the chat tutor.
 * Includes pedagogical persona, student context, and RAG results.
 */
export function buildSystemPrompt(
  student: StudentContext | null,
  ragResults: RRFResult<SearchableContent>[],
): string {
  const persona = `Du er en pedagogisk AI-tutor for norsk videregående matematikk (R1/R2).

REGLER:
- Svar ALLTID på norsk.
- Bruk norsk notasjon: komma som desimalskilletegn, norske fagtermer.
- Skriv matematikk med KaTeX-syntaks: inline $...$ og display $$...$$.
- ALDRI gi hele løsningen direkte. Still oppfølgingsspørsmål som leder eleven videre.
- Bruk sokratisk metode: hjelp eleven oppdage svaret selv.
- Vær oppmuntrende men ærlig. Korriger feil tydelig.
- Hold svarene konsise med mindre eleven ber om utdypning.
- Tilpass nivået fleksibelt basert på elevens mestring, men aldri avslør nivåkilden (ikke skriv «dette er fra R2/1T/1P»).`

  let studentSection = ''
  if (student) {
    studentSection = `\n\nELEVKONTEKST:
- Navn: ${student.displayName}
- Fag: ${student.currentSubject}
- Mestrede mål: ${student.masteredGoals.join(', ') || 'ingen ennå'}
- Utfordrende mål: ${student.strugglingGoals.join(', ') || 'ingen identifisert'}${
      student.targetGrade ? `\n- Målkarakter: ${student.targetGrade}` : ''
    }`
  }

  let ragSection = ''
  if (ragResults.length > 0) {
    const chunks = ragResults
      .slice(0, 5)
      .map(
        (r, i) =>
          `[${i + 1}] (${r.item.content_type}) ${r.item.chapter} > ${r.item.topic}:\n${r.item.content.slice(0, 500)}`,
      )
      .join('\n\n')
    ragSection = `\n\nRELEVANT PENSUM (bruk som referanse, ikke kopier direkte):\n${chunks}`
  }

  return persona + studentSection + ragSection
}
