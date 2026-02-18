import Link from 'next/link'

import { cn } from '@/lib/utils'

type PlanetNodeState = 'completed' | 'current' | 'future'

type PlanetNodeProps = {
  topic: string
  href: string
  dateLabel?: string | null
  state: PlanetNodeState
  index: number
}

const stateStyles: Record<PlanetNodeState, string> = {
  completed:
    'border-emerald-500/80 bg-emerald-500/25 text-emerald-100 shadow-[0_0_0_6px_rgba(16,185,129,0.08)]',
  current:
    'border-sky-400 bg-sky-400/25 text-sky-100 shadow-[0_0_0_10px_rgba(56,189,248,0.10)] motion-safe:animate-pulse',
  future: 'border-border bg-muted/30 text-muted-foreground',
}

export function PlanetNode({ topic, href, dateLabel, state, index }: PlanetNodeProps) {
  return (
    <li className="relative flex flex-col items-center gap-3 md:min-w-48 md:flex-1">
      <span className="text-xs text-muted-foreground">#{index + 1}</span>

      <Link
        href={href}
        className={cn(
          'group inline-flex h-16 w-16 items-center justify-center rounded-full border-2 text-lg font-semibold transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          stateStyles[state],
        )}
        aria-label={`Åpne tema ${topic}`}
      >
        {index + 1}
      </Link>

      <div className="text-center">
        <p className={cn('text-sm font-medium', state === 'future' && 'text-muted-foreground')}>{topic}</p>
        {dateLabel ? <p className="text-xs text-muted-foreground">{dateLabel}</p> : null}
      </div>
    </li>
  )
}
