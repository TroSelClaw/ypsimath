interface CompetencyGridProps {
  masteredGoals: string[]
  strugglingGoals: string[]
}

const GOALS = [
  'R1-01',
  'R1-02',
  'R1-03',
  'R1-04',
  'R1-05',
  'R1-06',
  'R1-07',
  'R1-08',
  'R1-09',
  'R1-10',
  'R1-11',
  'R1-12',
]

function statusForGoal(goal: string, mastered: Set<string>, struggling: Set<string>) {
  if (mastered.has(goal)) return { label: 'Mestret', className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' }
  if (struggling.has(goal)) return { label: 'Trenger øving', className: 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300' }
  return { label: 'På vei', className: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300' }
}

export function CompetencyGrid({ masteredGoals, strugglingGoals }: CompetencyGridProps) {
  const mastered = new Set(masteredGoals)
  const struggling = new Set(strugglingGoals)

  return (
    <section className="rounded-2xl border bg-card p-4 md:p-5">
      <h2 className="text-lg font-semibold">Kompetansemål (R1)</h2>
      <p className="mt-1 text-sm text-muted-foreground">Grønn = mestret, gul = i gang, rød = trenger øving.</p>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {GOALS.map((goal) => {
          const status = statusForGoal(goal, mastered, struggling)
          return (
            <div key={goal} className={`rounded-lg border px-3 py-2 text-sm ${status.className}`}>
              <p className="font-medium">{goal}</p>
              <p className="text-xs opacity-85">{status.label}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
