import { Badge } from '@/components/ui/badge'
import type { PlanEntry } from './calendar-view'

export function PlanTable({ entries }: { entries: PlanEntry[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="px-3 py-2 font-medium">Dato</th>
            <th className="px-3 py-2 font-medium">Tittel</th>
            <th className="px-3 py-2 font-medium">Type</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-t">
              <td className="px-3 py-2">{entry.date}</td>
              <td className="px-3 py-2">{entry.title}</td>
              <td className="px-3 py-2">
                <Badge variant="outline">{entry.entryType}</Badge>
              </td>
            </tr>
          ))}
          {entries.length === 0 && (
            <tr>
              <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">
                Ingen oppføringer i semesterplanen.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
