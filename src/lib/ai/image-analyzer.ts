interface AnalyzeExerciseImageInput {
  imageBase64: string
  mimeType: string
  exerciseContent: string
  solution?: string
}

interface AnalyzeExerciseImageResult {
  feedback: string
}

interface AnalyzeChatImageInput {
  imageBase64: string
  mimeType: string
}

interface AnalyzeChatImageResult {
  description: string
}

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

function getApiKey() {
  return process.env.GOOGLE_GENERATIVE_AI_API_KEY
}

export async function analyzeExerciseImage(input: AnalyzeExerciseImageInput): Promise<AnalyzeExerciseImageResult> {
  const apiKey = getApiKey()

  if (!apiKey) {
    return {
      feedback:
        'AI-feedback er midlertidig utilgjengelig fordi GOOGLE_GENERATIVE_AI_API_KEY mangler. Bildet er lagret, men analysen må kjøres senere.',
    }
  }

  const prompt = [
    'Du er en norsk mattelærer-assistent.',
    'Gi kort, konkret feedback på elevens utregning basert på oppgaveteksten og eventuelt fasit.',
    'Svar på norsk med tre deler: 1) Hva som er riktig 2) Hva som bør forbedres 3) Neste konkrete steg.',
    'Hold deg under 120 ord.',
    '',
    `Oppgave: ${input.exerciseContent}`,
    input.solution ? `Fasit/løsningsidé: ${input.solution}` : 'Fasit/løsningsidé: ikke oppgitt.',
  ].join('\n')

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: input.mimeType,
                data: input.imageBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 400,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Gemini-feil (${response.status})`)
  }

  const json = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }

  const feedback = json.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('\n').trim()

  if (!feedback) {
    throw new Error('Tomt svar fra Gemini')
  }

  return { feedback }
}

export async function analyzeChatImage(input: AnalyzeChatImageInput): Promise<AnalyzeChatImageResult> {
  const apiKey = getApiKey()

  if (!apiKey) {
    return {
      description:
        'Bildeanalyse er midlertidig utilgjengelig fordi GOOGLE_GENERATIVE_AI_API_KEY mangler.',
    }
  }

  const prompt = [
    'Beskriv matematisk relevant innhold i bildet for en norsk matte-tutor.',
    'Svar kort og strukturert med:',
    '1) Hva oppgaven/bildet viser',
    '2) Tall/symboler/uttrykk du kan lese',
    '3) Eventuelle usikkerheter.',
    'Hold deg under 120 ord.',
  ].join('\n')

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: input.mimeType,
                data: input.imageBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 300,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Gemini-feil (${response.status})`)
  }

  const json = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }

  const description = json.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('\n').trim()

  if (!description) {
    throw new Error('Tomt svar fra Gemini')
  }

  return { description }
}
