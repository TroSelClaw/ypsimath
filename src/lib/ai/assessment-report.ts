import { z } from 'zod/v4'

const assessmentResponseSchema = z.object({
  report: z.string().min(120).max(2500),
})

export interface AssessmentReportInput {
  student: {
    subject: string
    masteredGoals: string[]
    strugglingGoals: string[]
    totalExercisesCompleted: number
    totalTimeSpentMinutes: number
    targetGrade: number | null
    focusAreas: string | null
  }
  exams: {
    count: number
    averageScorePercent: number | null
    latestScores: number[]
  }
  activity: {
    activityLast30Days: number
    chatConversations: number
    chatMessagesThisWeek: number
  }
}

function buildPrompt(input: AssessmentReportInput) {
  return `Du er en faglig sterk, nøktern matematikklærerassistent som skriver vurderingsutkast for lærer.

Skriv på norsk, 200-300 ord.
Må inneholde:
1) styrker
2) forbedringsområder
3) konkrete kompetansemål (koder)
4) anbefalte neste tiltak
5) tydelig forbehold om at teksten er AI-generert utkast som lærer må kvalitetssikre.

VIKTIG:
- Bruk kun aggregerte data under.
- Ikke etterspør eller referer til rå meldingsinnhold/personlige detaljer.
- Hold tonen profesjonell, konkret og nyttig for standpunktvurdering.

DATA (aggregert):
${JSON.stringify(input, null, 2)}

Svar KUN som JSON:
{"report":"..."}`
}

function fallbackReport(input: AssessmentReportInput) {
  const avg = input.exams.averageScorePercent == null ? 'ingen vurderte prøver ennå' : `snitt ${input.exams.averageScorePercent.toFixed(1)} %`

  return `AI-generert utkast (må kvalitetssikres av lærer): Eleven viser styrke gjennom ${input.student.masteredGoals.length} mestrede mål, særlig ${input.student.masteredGoals.slice(0, 3).join(', ') || 'ingen tydelige mål foreløpig'}. Arbeidsinnsatsen er ${input.student.totalExercisesCompleted} fullførte oppgaver og ${input.student.totalTimeSpentMinutes} minutter registrert fagarbeid. Prøveresultater indikerer ${avg}, som peker på et jevnt, men fortsatt utviklingsbart nivå.

Forbedringsområdene er knyttet til ${input.student.strugglingGoals.slice(0, 4).join(', ') || 'stabil progresjon uten tydelige røde mål'}. Disse målene bør prioriteres i korte, hyppige økter med eksplisitt fokus på metodevalg, mellomregning og kontroll av svar. Dersom målkarakter ${input.student.targetGrade ?? 'ikke satt'} skal nås, anbefales en tydelig ukeplan med 2-3 målrettede arbeidsøkter, etterfulgt av egenvurdering og lærersamtale.

Anbefalte tiltak: 1) repetisjon av sentrale regler per mål, 2) oppgavetrening med gradvis økende vanskelighetsgrad, 3) rask tilbakemelding etter hver økt. Rapporten er et AI-generert utkast og skal brukes som støtte, ikke som endelig vurdering.`
}

export async function generateAssessmentReport(input: AssessmentReportInput): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY ?? process.env.AI_API_KEY

  if (!apiKey) {
    return fallbackReport(input)
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 1200,
      temperature: 0.3,
      messages: [{ role: 'user', content: buildPrompt(input) }],
    }),
    signal: AbortSignal.timeout(35_000),
  })

  if (!response.ok) {
    return fallbackReport(input)
  }

  const data = (await response.json()) as { content?: Array<{ type: string; text?: string }> }
  const text = data.content?.find((part) => part.type === 'text')?.text?.trim()

  if (!text) {
    return fallbackReport(input)
  }

  const jsonStart = text.indexOf('{')
  const jsonPayload = jsonStart >= 0 ? text.slice(jsonStart) : text

  try {
    const parsed = assessmentResponseSchema.parse(JSON.parse(jsonPayload))
    return parsed.report.trim()
  } catch {
    return fallbackReport(input)
  }
}
