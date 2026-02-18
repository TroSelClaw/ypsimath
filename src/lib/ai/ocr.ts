/**
 * OCR module — uses Gemini Flash for handwriting recognition on scanned exam pages.
 */

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

function getApiKey(): string {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!key) throw new Error('GOOGLE_GENERATIVE_AI_API_KEY mangler.')
  return key
}

export interface OcrResult {
  text: string
  confidence: 'high' | 'medium' | 'low'
}

/**
 * OCR a single page image (base64) using Gemini Flash.
 * Returns the transcribed mathematical content in plain text + LaTeX.
 */
export async function ocrPageImage(imageBase64: string, mimeType: string): Promise<OcrResult> {
  const apiKey = getApiKey()

  const prompt = [
    'Du er en ekspert-OCR for håndskrevne matematikkbesvarelser fra norske elever.',
    'Transkriper ALT matematisk innhold fra bildet:',
    '- Bruk LaTeX ($..$ for inline) for formler og uttrykk.',
    '- Behold elevens stegvise utregning i rekkefølge.',
    '- Marker overstrykninger/rettelser med [overstrøket: ...].',
    '- Marker uleselig tekst med [uleselig].',
    '- Inkluder norsk tekst (forklaringer, svar) ordrett.',
    '',
    'Svar med JSON: { "text": "<transkripsjon>", "confidence": "high"|"medium"|"low" }',
    'confidence = "low" hvis mye er uleselig, "medium" hvis noen usikkerheter, "high" ellers.',
  ].join('\n')

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: imageBase64 } },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2000,
        responseMimeType: 'application/json',
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Gemini OCR-feil (${response.status}): ${await response.text()}`)
  }

  const json = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }

  const raw = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
  if (!raw) throw new Error('Tomt OCR-svar fra Gemini.')

  try {
    const parsed = JSON.parse(raw) as { text: string; confidence: string }
    return {
      text: parsed.text ?? '',
      confidence: (['high', 'medium', 'low'].includes(parsed.confidence)
        ? parsed.confidence
        : 'medium') as OcrResult['confidence'],
    }
  } catch {
    // Fallback: treat the entire response as text
    return { text: raw, confidence: 'medium' }
  }
}

/**
 * OCR multiple page images in sequence, returning combined text per page.
 */
export async function ocrPages(
  pages: Array<{ imageBase64: string; mimeType: string; pageNumber: number }>,
): Promise<Array<{ pageNumber: number; text: string; confidence: OcrResult['confidence'] }>> {
  const results: Array<{ pageNumber: number; text: string; confidence: OcrResult['confidence'] }> = []

  for (const page of pages) {
    const result = await ocrPageImage(page.imageBase64, page.mimeType)
    results.push({ pageNumber: page.pageNumber, ...result })
  }

  return results
}
