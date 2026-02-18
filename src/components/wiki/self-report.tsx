'use client'

import { Button } from '@/components/ui/button'

export type SelfReportResult = 'correct' | 'partial' | 'incorrect'

interface SelfReportProps {
  disabled?: boolean
  onSelect: (value: SelfReportResult) => void
}

export function SelfReport({ disabled = false, onSelect }: SelfReportProps) {
  return (
    <div className="space-y-2 rounded-md border p-3">
      <p className="text-sm font-medium">Hvordan gikk det?</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="default" size="sm" disabled={disabled} onClick={() => onSelect('correct')}>
          Fikk til
        </Button>
        <Button type="button" variant="secondary" size="sm" disabled={disabled} onClick={() => onSelect('partial')}>
          Delvis
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => onSelect('incorrect')}>
          Fikk ikke til
        </Button>
      </div>
    </div>
  )
}
