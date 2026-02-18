import { PlanetNode } from '@/components/journey/planet-node'

export type JourneyTopic = {
  topic: string
  href: string
  dateLabel?: string | null
  status: 'completed' | 'current' | 'future'
}

type PlanetMapProps = {
  topics: JourneyTopic[]
}

export function PlanetMap({ topics }: PlanetMapProps) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm md:p-6">
      <div className="overflow-x-auto pb-2 md:overflow-visible">
        <ol className="relative flex min-w-[780px] items-start gap-4 md:min-w-0 md:flex-col md:gap-6 lg:flex-row lg:items-stretch">
          <svg
            aria-hidden
            className="pointer-events-none absolute left-10 right-10 top-11 hidden h-4 text-border/80 lg:block"
            viewBox="0 0 100 4"
            preserveAspectRatio="none"
          >
            <path d="M0 2 H100" stroke="currentColor" strokeWidth="0.65" strokeDasharray="1.6 1.4" fill="none" />
          </svg>

          {topics.map((entry, index) => (
            <PlanetNode
              key={`${entry.topic}-${entry.dateLabel ?? 'na'}`}
              index={index}
              topic={entry.topic}
              href={entry.href}
              dateLabel={entry.dateLabel}
              state={entry.status}
            />
          ))}
        </ol>
      </div>
    </div>
  )
}
