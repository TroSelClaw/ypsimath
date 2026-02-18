'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'

interface RecommendationItem {
  id: string
  text: string
  topic: string
  href: string
}

interface RecommendationResponse {
  recommendations: RecommendationItem[]
  cached: boolean
}

function RecommendationsSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-4 w-full animate-pulse rounded bg-muted" />
      <div className="h-4 w-[92%] animate-pulse rounded bg-muted" />
      <div className="h-4 w-[84%] animate-pulse rounded bg-muted" />
    </div>
  )
}

export function ProfileRecommendations() {
  const [items, setItems] = useState<RecommendationItem[]>([])
  const [cached, setCached] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  const load = useCallback(async (force = false) => {
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/profile/recommendations${force ? '?force=1' : ''}`, {
        method: 'GET',
        cache: 'no-store',
      })

      const body = (await response.json()) as RecommendationResponse & { error?: string }

      if (!response.ok) {
        throw new Error(body.error ?? 'Kunne ikke hente anbefalinger.')
      }

      setItems(body.recommendations ?? [])
      setCached(Boolean(body.cached))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke hente anbefalinger.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(false)
  }, [load])

  return (
    <section className="rounded-2xl border bg-card p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Studieanbefalinger</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Personlige forslag basert på progresjon og oppgavehistorikk.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={isLoading || isPending}
          onClick={() => {
            startTransition(() => {
              void load(true)
            })
          }}
        >
          Oppdater anbefalinger
        </Button>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <RecommendationsSkeleton />
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ingen anbefalinger ennå. Løs noen oppgaver først.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {items.map((item) => (
              <li key={item.id} className="rounded-lg border bg-background px-3 py-2">
                <p>{item.text}</p>
                <Link href={item.href} className="mt-2 inline-block font-medium text-primary hover:underline">
                  Gå til tema: {item.topic}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {!isLoading && !error && items.length > 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">{cached ? 'Viser bufrede anbefalinger (opptil 24 timer).' : 'Nylig oppdaterte anbefalinger.'}</p>
        ) : null}
      </div>
    </section>
  )
}
