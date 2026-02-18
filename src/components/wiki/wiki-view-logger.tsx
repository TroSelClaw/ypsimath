'use client'

import { useEffect } from 'react'

export function WikiViewLogger({ subjectId, topic }: { subjectId: string; topic: string }) {
  useEffect(() => {
    const startedAt = Date.now()

    fetch('/api/activity', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        type: 'wiki_view',
        subjectId,
        topic,
        metadata: { event: 'view_start' },
      }),
    }).catch(() => undefined)

    const onPageHide = () => {
      const payload = JSON.stringify({
        type: 'wiki_view',
        subjectId,
        topic,
        durationSeconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
        metadata: { event: 'view_end' },
      })

      navigator.sendBeacon('/api/activity', payload)
    }

    window.addEventListener('pagehide', onPageHide)
    return () => {
      window.removeEventListener('pagehide', onPageHide)
      onPageHide()
    }
  }, [subjectId, topic])

  return null
}
