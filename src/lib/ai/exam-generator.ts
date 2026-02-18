import { z } from 'zod/v4'
import type { CreateExamInput } from '@/lib/schemas/exams'

/** Schema for a single generated exam question from the LLM */
export const generatedQuestionSchema = z.object({
  part: z.number().int().min(1).max(2),
  question_number: z.number().int().positive(),
  content: z.string().min(1),
  max_points: z.number().positive(),
  solution: z.string().min(1),
  grading_criteria: z.string().min(1),
  competency_goals: z.array(z.string()).optional(),
})

export const generatedExamSchema = z.object({
  questions: z.array(generatedQuestionSchema).min(1),
})

export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>
export type GeneratedExam = z.infer<typeof generatedExamSchema>

/**
 * Build the exam generation prompt from config + RAG context.
 */
export function buildExamPrompt(
  config: CreateExamInput,
  ragContext: string[],
): { system: string; user: string } {
  const system = `Du er en ekspert på å lage matematikkprøver for norsk videregående (R1).

Regler:
- Skriv alle oppgaver og løsninger på norsk.
- Bruk KaTeX-kompatibel LaTeX ($..$ for inline, $$...$$ for display).
- Bruk norsk notasjon: desimalkomma, f(x) = ..., osv.
- Del 1 er UTEN hjelpemidler (ingen CAS/kalkulator). Del 2 er MED hjelpemidler.
- Del 1-oppgaver skal testes uten digitale verktøy — hold dem rimelig regnbare for hånd.
- Oppgavene skal ikke være identiske med kontekstmaterialet, men dekke tilsvarende kompetansemål.
- Returner BARE gyldig JSON i formatet: { "questions": [...] }

Hvert spørsmål har: part (1 eller 2), question_number, content (oppgavetekst), max_points, solution (fullstendig løsning), grading_criteria (vurderingskriterier for sensor), competency_goals (liste med koder).`

  const goalsList = config.competency_goals.join(', ')
  const contextBlock = ragContext.length > 0
    ? `\n\nRelevant faginnhold for kontekst:\n${ragContext.map((c, i) => `[${i + 1}] ${c}`).join('\n')}`
    : ''

  const user = `Lag en prøve med følgende parametere:
- Tittel: ${config.title}
- Total varighet: ${config.total_duration_minutes} min
- Del 1: ${config.part1_duration_minutes} min (uten hjelpemidler)
- Del 2: ${config.part2_duration_minutes} min (med hjelpemidler)
- Kompetansemål: ${goalsList}
- Vanskelighetsfordeling: ${config.difficulty_mix.easy}% lett, ${config.difficulty_mix.medium}% middels, ${config.difficulty_mix.hard}% vanskelig
- Estimert antall oppgaver: ~${Math.round(config.total_duration_minutes / 20)}
${contextBlock}

Generer prøven som JSON.`

  return { system, user }
}
