import Link from 'next/link'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type HeatmapStudent = {
  id: string
  name: string
  masteryByGoal: Record<string, number>
}

type ClassHeatmapProps = {
  goals: readonly string[]
  students: HeatmapStudent[]
}

function cellClass(value: number) {
  if (value >= 80) return 'bg-emerald-500/20 text-emerald-900 dark:text-emerald-200 border-emerald-500/40'
  if (value >= 50) return 'bg-amber-500/20 text-amber-900 dark:text-amber-200 border-amber-500/40'
  return 'bg-rose-500/20 text-rose-900 dark:text-rose-200 border-rose-500/40'
}

export function ClassHeatmap({ goals, students }: ClassHeatmapProps) {
  if (!students.length) {
    return (
      <section className="rounded-2xl border bg-card p-4 md:p-5">
        <h2 className="text-lg font-semibold">Kompetanse-heatmap</h2>
        <p className="mt-2 text-sm text-muted-foreground">Ingen elever i klassen ennå.</p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border bg-card p-4 md:p-5">
      <h2 className="text-lg font-semibold">Kompetanse-heatmap</h2>
      <p className="mt-1 text-sm text-muted-foreground">Klikk en celle for å åpne elevdetalj på valgt kompetansemål.</p>

      <div className="mt-4 overflow-x-auto">
        <TooltipProvider>
          <table className="min-w-[900px] border-separate border-spacing-1 text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-card px-2 py-1 text-left font-medium">Elev</th>
                {goals.map((goal) => (
                  <th key={goal} className="whitespace-nowrap px-2 py-1 text-center font-medium text-muted-foreground">
                    {goal}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <th className="sticky left-0 z-10 bg-card px-2 py-2 text-left font-medium">{student.name}</th>
                  {goals.map((goal) => {
                    const value = student.masteryByGoal[goal] ?? 0
                    return (
                      <td key={`${student.id}-${goal}`} className="p-0.5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href={`/laerer/elev/${student.id}?goal=${goal}`}
                              className={cn('flex h-9 w-14 items-center justify-center rounded border text-xs font-semibold', cellClass(value))}
                              aria-label={`${student.name} ${goal}: ${value}%`}
                            >
                              {value}%
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={6}>
                            <p>{student.name}</p>
                            <p>{goal}</p>
                            <p>{value}% mestring</p>
                          </TooltipContent>
                        </Tooltip>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </TooltipProvider>
      </div>
    </section>
  )
}
