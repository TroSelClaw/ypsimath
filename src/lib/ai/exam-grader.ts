/**
 * AI exam grading pipeline.
 *
 * Flow per submission:
 * 1. Extract student's pages from scanned PDF (pdf-lib)
 * 2. Convert pages to images → OCR via Gemini Flash
 * 3. Score each question via GPT-4o with grading criteria
 * 4. Store results in exam_answers + update submission
 */

import { PDFDocument } from 'pdf-lib'
import { ocrPages, type OcrResult } from './ocr'
import { z } from 'zod/v4'

// ---------- Types ----------

export interface GradingInput {
  submissionId: string
  examId: string
  studentId: string
  scanPdfBytes: Uint8Array
  startPage: number
  endPage: number
  questions: Array<{
    id: string
    part: number
    question_number: number
    content: string
    max_points: number
    solution: string
    grading_criteria: string
  }>
}

export interface QuestionGradingResult {
  questionId: string
  studentAnswerText: string
  scorePercent: number
  confidenceScore: number
  errorAnalysis: ErrorAnalysis
  llmFeedback: string
}

export interface ErrorAnalysis {
  fortegnsfeil: boolean
  konseptfeil: boolean
  regnefeil: boolean
  manglende_steg: boolean
  details: string
}

export interface GradingResult {
  submissionId: string
  answers: QuestionGradingResult[]
  totalScorePercent: number
  ocrConfidence: OcrResult['confidence']
}

// ---------- Schemas ----------

const scoringResponseSchema = z.object({
  score_percent: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  error_analysis: z.object({
    fortegnsfeil: z.boolean(),
    konseptfeil: z.boolean(),
    regnefeil: z.boolean(),
    manglende_steg: z.boolean(),
    details: z.string(),
  }),
  feedback: z.string(),
})

// ---------- PDF page extraction ----------

/**
 * Extract a range of pages from a PDF as individual page PDFs (base64).
 */
export async function extractPagesAsImages(
  pdfBytes: Uint8Array,
  startPage: number,
  endPage: number,
): Promise<Array<{ pageNumber: number; imageBase64: string; mimeType: string }>> {
  const srcDoc = await PDFDocument.load(pdfBytes)
  const totalPages = srcDoc.getPageCount()

  if (startPage < 1 || endPage > totalPages || startPage > endPage) {
    throw new Error(`Ugyldig sideintervall: ${startPage}-${endPage} (PDF har ${totalPages} sider)`)
  }

  const pages: Array<{ pageNumber: number; imageBase64: string; mimeType: string }> = []

  for (let i = startPage; i <= endPage; i++) {
    // Create a single-page PDF for each page
    const singleDoc = await PDFDocument.create()
    const [copiedPage] = await singleDoc.copyPages(srcDoc, [i - 1])
    singleDoc.addPage(copiedPage)
    const singlePdfBytes = await singleDoc.save()

    // We send the PDF page as-is to Gemini (it handles PDF input)
    const base64 = uint8ArrayToBase64(singlePdfBytes)
    pages.push({
      pageNumber: i,
      imageBase64: base64,
      mimeType: 'application/pdf',
    })
  }

  return pages
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

// ---------- Scoring via OpenAI ----------

async function scoreAnswer(
  question: GradingInput['questions'][number],
  studentAnswerText: string,
): Promise<Omit<QuestionGradingResult, 'questionId'>> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY mangler.')

  const systemPrompt = `Du er en erfaren norsk matematikklærer som retter prøvebesvarelser for R1.

Du skal vurdere elevens svar mot fasit og vurderingskriterier.
Gi en rettferdig vurdering med fokus på matematisk korrekthet og fremgangsmåte.

Feilkategorier å identifisere:
- fortegnsfeil: feil fortegn (+/-)
- konseptfeil: grunnleggende misforståelse av konseptet
- regnefeil: riktig metode men feil i utregning
- manglende_steg: mangler viktige mellomregninger

Svar med JSON: {
  "score_percent": 0-100,
  "confidence": 0-100 (hvor sikker du er på vurderingen),
  "error_analysis": { "fortegnsfeil": bool, "konseptfeil": bool, "regnefeil": bool, "manglende_steg": bool, "details": "kort forklaring" },
  "feedback": "Konstruktiv tilbakemelding til eleven på norsk"
}`

  const userPrompt = `Oppgave ${question.question_number} (Del ${question.part}, ${question.max_points} poeng):
${question.content}

Fasit:
${question.solution}

Vurderingskriterier:
${question.grading_criteria}

Elevens svar (transkribert fra håndskrift):
${studentAnswerText || '[Tomt / ikke besvart]'}`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI scoring-feil (${response.status}): ${await response.text()}`)
  }

  const json = (await response.json()) as {
    choices: Array<{ message: { content: string } }>
  }

  const raw = json.choices[0]?.message?.content
  if (!raw) throw new Error('Tomt svar fra OpenAI.')

  const parsed = scoringResponseSchema.parse(JSON.parse(raw))

  return {
    studentAnswerText,
    scorePercent: parsed.score_percent,
    confidenceScore: parsed.confidence,
    errorAnalysis: parsed.error_analysis,
    llmFeedback: parsed.feedback,
  }
}

// ---------- Main grading pipeline ----------

/**
 * Grade a single student submission.
 */
export async function gradeSubmission(input: GradingInput): Promise<GradingResult> {
  // 1. Extract pages from PDF
  const pageImages = await extractPagesAsImages(input.scanPdfBytes, input.startPage, input.endPage)

  // 2. OCR all pages
  const ocrResults = await ocrPages(pageImages)
  const fullOcrText = ocrResults.map((r) => r.text).join('\n\n---\n\n')
  const worstConfidence = ocrResults.reduce<OcrResult['confidence']>(
    (worst, r) => {
      const order: Record<string, number> = { low: 0, medium: 1, high: 2 }
      return (order[r.confidence] ?? 1) < (order[worst] ?? 1) ? r.confidence : worst
    },
    'high',
  )

  // 3. Score each question
  const answers: QuestionGradingResult[] = []
  for (const question of input.questions) {
    const result = await scoreAnswer(question, fullOcrText)
    answers.push({ questionId: question.id, ...result })
  }

  // 4. Compute total
  const totalMaxPoints = input.questions.reduce((sum, q) => sum + q.max_points, 0)
  const totalEarned = input.questions.reduce((sum, q, i) => {
    return sum + (q.max_points * answers[i].scorePercent) / 100
  }, 0)
  const totalScorePercent = totalMaxPoints > 0 ? Math.round((totalEarned / totalMaxPoints) * 100) : 0

  return {
    submissionId: input.submissionId,
    answers,
    totalScorePercent,
    ocrConfidence: worstConfidence,
  }
}
