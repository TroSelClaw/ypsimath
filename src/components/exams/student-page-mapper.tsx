'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface StudentMapping {
  studentId: string
  studentName: string
  studentEmail: string
  startPage: number | ''
  endPage: number | ''
}

interface Props {
  mappings: StudentMapping[]
  onChange: (studentId: string, field: 'startPage' | 'endPage', value: number | '') => void
}

export function StudentPageMapper({ mappings, onChange }: Props) {
  return (
    <div className="space-y-3">
      {mappings.map((m) => (
        <div key={m.studentId} className="grid grid-cols-12 gap-2 items-end rounded-md border p-3">
          <div className="col-span-6">
            <p className="text-sm font-medium">{m.studentName}</p>
            <p className="text-xs text-muted-foreground">{m.studentEmail}</p>
          </div>
          <div className="col-span-3 space-y-1">
            <Label className="text-xs">Startside</Label>
            <Input
              type="number"
              min={1}
              value={m.startPage}
              onChange={(e) => onChange(m.studentId, 'startPage', e.target.value ? Number(e.target.value) : '')}
            />
          </div>
          <div className="col-span-3 space-y-1">
            <Label className="text-xs">Sluttside</Label>
            <Input
              type="number"
              min={1}
              value={m.endPage}
              onChange={(e) => onChange(m.studentId, 'endPage', e.target.value ? Number(e.target.value) : '')}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
