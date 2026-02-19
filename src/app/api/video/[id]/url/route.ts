import { NextResponse } from 'next/server'

import { requireApiUser } from '@/lib/auth/api-auth'
import { AuthError } from '@/lib/errors'

interface Params {
  id: string
}

export async function GET(_request: Request, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params
    const { supabase } = await requireApiUser()

    const { data: video, error } = await supabase
      .from('videos')
      .select('id, video_url, status')
      .eq('id', id)
      .eq('status', 'ready')
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: 'Kunne ikke hente video' }, { status: 500 })
    }

    if (!video?.video_url) {
      return NextResponse.json({ error: 'Video ikke funnet' }, { status: 404 })
    }

    const marker = '/storage/v1/object/public/videos/'
    const idx = video.video_url.indexOf(marker)
    if (idx === -1) {
      return NextResponse.json({ error: 'Ugyldig video-url' }, { status: 400 })
    }

    const storagePath = video.video_url.slice(idx + marker.length)

    const { data: signed, error: signError } = await supabase.storage
      .from('videos')
      .createSignedUrl(storagePath, 60 * 60 * 24)

    if (signError || !signed?.signedUrl) {
      return NextResponse.json({ error: 'Kunne ikke signere video-url' }, { status: 500 })
    }

    return NextResponse.json({ url: signed.signedUrl })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }

    return NextResponse.json({ error: 'Kunne ikke hente video-url' }, { status: 500 })
  }
}
