import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

interface Params {
  id: string
}

export async function GET(_request: Request, { params }: { params: Promise<Params> }) {
  const { id } = await params
  const supabase = await createClient()

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
}
