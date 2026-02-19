'use client'

import { useEffect, useRef, useState } from 'react'

interface VideoPlayerProps {
  videoId: string
  thumbnailUrl?: string | null
  durationSeconds?: number | null
}

export function VideoPlayer({ videoId, thumbnailUrl, durationSeconds }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const watchStartRef = useRef<number | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible || videoUrl) return

    setLoading(true)
    fetch(`/api/video/${videoId}/url`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load video')
        return res.json() as Promise<{ url: string }>
      })
      .then((data) => {
        setVideoUrl(data.url)
        setLoading(false)
      })
      .catch(() => {
        setError('Kunne ikke laste video')
        setLoading(false)
      })
  }, [isVisible, videoId, videoUrl])

  const handlePlay = () => {
    watchStartRef.current = Date.now()
  }

  const handleEnded = () => {
    if (!watchStartRef.current) return
    const watchDuration = Math.round((Date.now() - watchStartRef.current) / 1000)

    const payload = JSON.stringify({
      type: 'video_watched',
      durationSeconds: watchDuration,
      metadata: { videoId, durationSeconds },
    })

    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/activity', payload)
    }
  }

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div ref={containerRef} className="my-4 overflow-hidden rounded-lg bg-muted">
      {error ? (
        <div className="p-4 text-sm text-muted-foreground">{error}</div>
      ) : loading || !videoUrl ? (
        <div className="aspect-video flex items-center justify-center bg-muted">
          <div className="text-sm text-muted-foreground">{loading ? 'Laster video...' : ''}</div>
        </div>
      ) : (
        <div className="relative">
          <video
            src={videoUrl}
            poster={thumbnailUrl ?? undefined}
            controls
            preload="metadata"
            className="aspect-video w-full"
            onPlay={handlePlay}
            onEnded={handleEnded}
          >
            Nettleseren din støtter ikke videoavspilling.
          </video>
          {durationSeconds != null && (
            <div className="pointer-events-none absolute bottom-2 right-2 rounded bg-black/70 px-2 py-0.5 text-xs text-white">
              {formatDuration(durationSeconds)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
