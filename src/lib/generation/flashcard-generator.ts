/**
 * Flashcard generation helper for TASK-063.
 */

export interface FlashcardPair {
  front: string
  back: string
}

export interface GenerateFlashcardsOptions {
  subjectId: string
  chapter: string
  topic: string
  competencyGoals: string[]
  sourceText: string
  apiKey?: string
  apiBaseUrl?: string
  model?: string
}

const DEFAULT_MODEL = 'claude-sonnet-4-6-20250514'

function buildPrompt(options: GenerateFlashcardsOptions) {
  return `Du lager norske flashcards for matematikkfaget ${options.subjectId}.

Kontekst:
- Kapittel: ${options.chapter}
- Tema: ${options.topic}
- Kompetansemål: ${options.competencyGoals.join(', ') || 'ingen oppgitt'}

Kildetekst:
${options.sourceText.slice(0, 12000)}

Lag 6-10 flashcards som JSON-array med format:
[
  {"front":"...","back":"..."}
]

Krav:
- Front er kort termel/formel/spørsmål (KaTeX tillatt med $...$).
- Back forklarer begrepet på norsk + ett kort eksempel.
- Ingen duplikater.
- Bare gyldig JSON i svaret.`
}

function parseFlashcards(rawText: string): FlashcardPair[] {
  const jsonMatch = rawText.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    throw new Error('Kunne ikke parse JSON-array fra LLM-svar')
  }

  const parsed = JSON.parse(jsonMatch[0]) as Array<{ front?: string; back?: string }>
  const normalized = parsed
    .map((entry) => ({
      front: entry.front?.trim() ?? '',
      back: entry.back?.trim() ?? '',
    }))
    .filter((entry) => entry.front.length > 0 && entry.back.length > 0)

  if (normalized.length === 0) {
    throw new Error('LLM returnerte ingen gyldige flashcards')
  }

  return normalized
}

export async function generateFlashcardsForTopic(
  options: GenerateFlashcardsOptions,
): Promise<FlashcardPair[]> {
  const apiKey = options.apiKey ?? process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required')
  }

  const apiBaseUrl = options.apiBaseUrl ?? process.env.AI_API_BASE_URL ?? 'https://api.anthropic.com/v1'
  const model = options.model ?? DEFAULT_MODEL

  const response = await fetch(`${apiBaseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: buildPrompt(options),
        },
      ],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`LLM API error (${response.status}): ${error}`)
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text?: string }>
  }

  const text = data.content.find((part) => part.type === 'text')?.text
  if (!text) {
    throw new Error('Tomt LLM-svar ved flashcard-generering')
  }

  return parseFlashcards(text)
}

export function toFlashcardContent(front: string, back: string): string {
  return `**Foran:** ${front}\n\n**Bak:** ${back}`
}
