interface StatsCardsProps {
  totalExercises: number
  totalTimeMinutes: number
  currentWeekActivities: number
}

export function StatsCards({ totalExercises, totalTimeMinutes, currentWeekActivities }: StatsCardsProps) {
  const totalHours = Math.round((totalTimeMinutes / 60) * 10) / 10

  return (
    <section className="grid gap-3 sm:grid-cols-3">
      <article className="rounded-xl border bg-card p-4">
        <p className="text-xs uppercase text-muted-foreground">Oppgaver fullført</p>
        <p className="mt-1 text-2xl font-semibold">{totalExercises}</p>
      </article>

      <article className="rounded-xl border bg-card p-4">
        <p className="text-xs uppercase text-muted-foreground">Tid brukt</p>
        <p className="mt-1 text-2xl font-semibold">{totalHours} t</p>
      </article>

      <article className="rounded-xl border bg-card p-4">
        <p className="text-xs uppercase text-muted-foreground">Aktivitet denne uka</p>
        <p className="mt-1 text-2xl font-semibold">{currentWeekActivities}</p>
      </article>
    </section>
  )
}
