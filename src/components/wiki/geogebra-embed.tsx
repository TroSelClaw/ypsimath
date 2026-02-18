'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { Skeleton } from '@/components/ui/skeleton'

interface GeoGebraEmbedProps {
  materialId?: string
  url?: string
  title?: string
  className?: string
}

function buildGeoGebraUrl(materialId?: string, url?: string) {
  if (url) {
    return url
  }

  if (!materialId) {
    return null
  }

  return `https://www.geogebra.org/material/iframe/id/${materialId}/width/960/height/540/border/888888/rc/false/ai/false/sdz/false`
}

export function GeoGebraEmbed({ materialId, url, title = 'GeoGebra-visualisering', className }: GeoGebraEmbedProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const src = useMemo(() => buildGeoGebraUrl(materialId, url), [materialId, url])

  useEffect(() => {
    if (!containerRef.current || isVisible) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '200px',
      },
    )

    observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, [isVisible])

  if (!src) {
    return (
      <section className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">GeoGebra kunne ikke lastes: mangler materialId eller URL.</p>
      </section>
    )
  }

  return (
    <section ref={containerRef} className={className}>
      <div className="relative aspect-video overflow-hidden rounded-lg border bg-muted/30">
        {!isLoaded ? <Skeleton className="absolute inset-0 h-full w-full" /> : null}

        {isVisible ? (
          <iframe
            src={src}
            title={title}
            className="absolute inset-0 h-full w-full"
            allow="fullscreen"
            sandbox="allow-scripts allow-same-origin allow-popups"
            onLoad={() => setIsLoaded(true)}
          />
        ) : null}
      </div>

      <p className="mt-2 text-sm">
        <a
          href={url ?? `https://www.geogebra.org/m/${materialId}`}
          target="_blank"
          rel="noreferrer"
          className="text-primary underline-offset-4 hover:underline"
        >
          Åpne i GeoGebra
        </a>
      </p>
    </section>
  )
}
