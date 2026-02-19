import { NextResponse } from 'next/server'
import { z } from 'zod/v4'
import { recordExerciseAttempt } from '@/app/actions/exercises'
import { analyzeExerciseImage } from '@/lib/ai/image-analyzer'
import { requireApiUser } from '@/lib/auth/api-auth'
import { AuthError } from '@/lib/errors'
import { RATE_LIMITS, rateLimit } from '@/lib/rate-limit'

const MAX_SIZE_BYTES = 10 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

const metadataSchema = z.object({
  contentElementId: z.string().uuid(),
  exerciseContent: z.string().min(1),
  solution: z.string().optional(),
  hintsUsed: z.number().int().min(0).optional(),
  viewedSolution: z.boolean().optional(),
})

function extFromMime(mimeType: string) {
  if (mimeType === 'image/png') return 'png'
  if (mimeType === 'image/webp') return 'webp'
  return 'jpg'
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireApiUser()

    const rate = rateLimit(`image-check:${user.id}`, RATE_LIMITS.imageUpload)
    if (!rate.allowed) {
      return NextResponse.json(
        { error: `For mange forespørsler. Prøv igjen om ${rate.retryAfterSeconds} sekunder.` },
        {
          status: 429,
          headers: {
            'Retry-After': String(rate.retryAfterSeconds),
          },
        },
      )
    }

    const formData = await request.formData()
    const rawMeta = formData.get('metadata')
    const file = formData.get('file')

    if (typeof rawMeta !== 'string') {
      return NextResponse.json({ error: 'Mangler metadata.' }, { status: 400 })
    }

    const parsed = metadataSchema.safeParse(JSON.parse(rawMeta))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ugyldig metadata for bildeanalyse.' }, { status: 400 })
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Mangler bildefil.' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Kun JPEG, PNG og WEBP støttes.' }, { status: 400 })
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'Bildet er for stort. Maks størrelse er 10 MB.' }, { status: 400 })
    }

    const fileExt = extFromMime(file.type)
    const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`

    const uploadBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from('user-uploads')
      .upload(filePath, uploadBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: 'Kunne ikke laste opp bildet.' }, { status: 500 })
    }

    const imageBase64 = Buffer.from(uploadBuffer).toString('base64')

    const analysis = await analyzeExerciseImage({
      imageBase64,
      mimeType: file.type,
      exerciseContent: parsed.data.exerciseContent,
      solution: parsed.data.solution,
    })

    const attemptResult = await recordExerciseAttempt({
      contentElementId: parsed.data.contentElementId,
      checkMethod: 'image_check',
      hintsUsed: parsed.data.hintsUsed ?? 0,
      viewedSolution: parsed.data.viewedSolution ?? true,
      imageUrl: filePath,
      imageFeedback: analysis.feedback,
    })

    if (!attemptResult.ok) {
      return NextResponse.json({ error: attemptResult.error }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      imageUrl: filePath,
      feedback: analysis.feedback,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }

    return NextResponse.json({ error: 'Kunne ikke analysere bildet.' }, { status: 500 })
  }
}
