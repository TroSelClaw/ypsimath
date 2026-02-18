'use client'

import Link from 'next/link'

interface Source {
  id: string
  topic: string
  chapter: string
  content_type: string
}

interface SourceChipsProps {
  sources?: Source[]
}

export function SourceChips({ sources }: SourceChipsProps) {
  if (!sources?.length) return null

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {sources.map((source) => (
        <Link
          key={source.id}
          href={`/wiki/r1/${source.topic}#${source.id}`}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <span className="font-medium">{source.chapter}</span>
          <span>›</span>
          <span>{source.topic}</span>
        </Link>
      ))}
    </div>
  )
}
