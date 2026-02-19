import Link from 'next/link'

type AlertStudent = {
  id: string
  name: string
  email: string
  strugglingGoals: string[]
  behindByTopics: number
}

type AlertCardsProps = {
  struggling: AlertStudent[]
  behindPlan: AlertStudent[]
}

export function AlertCards({ struggling, behindPlan }: AlertCardsProps) {
  if (!struggling.length && !behindPlan.length) {
    return (
      <section className="rounded-2xl border bg-card p-4 md:p-5">
        <h2 className="text-lg font-semibold">Varsler</h2>
        <p className="mt-2 text-sm text-muted-foreground">Ingen kritiske varsler akkurat nå.</p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border bg-card p-4 md:p-5">
      <h2 className="text-lg font-semibold">Varsler</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {struggling.map((student) => (
          <article key={`struggling-${student.id}`} className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm">
            <p className="font-semibold">{student.name}</p>
            <p className="text-xs text-muted-foreground">{student.email}</p>
            <p className="mt-2">Mange utfordringer ({student.strugglingGoals.length} mål i rød sone).</p>
            <Link href={`/laerer/elev/${student.id}`} className="mt-2 inline-block font-medium underline underline-offset-4">
              Åpne elevdetalj
            </Link>
          </article>
        ))}

        {behindPlan.map((student) => (
          <article key={`behind-${student.id}`} className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            <p className="font-semibold">{student.name}</p>
            <p className="text-xs text-muted-foreground">{student.email}</p>
            <p className="mt-2">Bak plan med {student.behindByTopics} tema.</p>
            <Link href={`/laerer/elev/${student.id}`} className="mt-2 inline-block font-medium underline underline-offset-4">
              Åpne elevdetalj
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}
