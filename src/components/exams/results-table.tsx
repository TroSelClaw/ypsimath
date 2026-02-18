'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface StudentResult {
  submissionId: string
  studentId: string
  studentName: string
  studentEmail: string
  status: 'scanned' | 'grading' | 'graded' | 'reviewed'
  totalScorePercent: number | null
  part1ScorePercent: number | null
  part2ScorePercent: number | null
  avgConfidence: number | null
}

interface Props {
  results: StudentResult[]
  onSelectStudent: (submissionId: string) => void
  onExportCsv: () => void
}

function confidenceBadge(confidence: number | null) {
  if (confidence === null) return null
  if (confidence >= 70) return <Badge variant="outline" className="text-green-600">Høy</Badge>
  if (confidence >= 40) return <Badge variant="outline" className="text-yellow-600">Middels</Badge>
  return <Badge variant="destructive">Lav ⚠️</Badge>
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    scanned: 'Venter',
    grading: 'Retter…',
    graded: 'Rettet',
    reviewed: 'Gjennomgått',
  }
  return map[status] ?? status
}

export function ResultsTable({ results, onSelectStudent, onExportCsv }: Props) {
  const stats = useMemo(() => {
    const graded = results.filter((r) => r.totalScorePercent !== null)
    if (graded.length === 0) return null

    const scores = graded.map((r) => r.totalScorePercent!)
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    const sorted = [...scores].sort((a, b) => a - b)
    const median =
      sorted.length % 2 === 0
        ? Math.round((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2)
        : sorted[Math.floor(sorted.length / 2)]

    // Distribution: 0-20, 20-40, 40-60, 60-80, 80-100
    const bins = [0, 0, 0, 0, 0]
    for (const s of scores) {
      const idx = Math.min(Math.floor(s / 20), 4)
      bins[idx]++
    }

    return { avg, median, min: sorted[0], max: sorted[sorted.length - 1], bins, count: graded.length }
  }, [results])

  return (
    <div className="space-y-6">
      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Gjennomsnitt" value={`${stats.avg}%`} />
          <StatCard label="Median" value={`${stats.median}%`} />
          <StatCard label="Lavest" value={`${stats.min}%`} />
          <StatCard label="Høyest" value={`${stats.max}%`} />
        </div>
      )}

      {/* Distribution */}
      {stats && (
        <div className="flex items-end gap-1 h-16">
          {['0-20', '20-40', '40-60', '60-80', '80-100'].map((label, i) => (
            <div key={label} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-primary/60 rounded-t"
                style={{ height: `${stats.count > 0 ? (stats.bins[i] / stats.count) * 100 : 0}%`, minHeight: stats.bins[i] > 0 ? 4 : 0 }}
              />
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 pr-4">Elev</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Del 1</th>
              <th className="py-2 pr-4">Del 2</th>
              <th className="py-2 pr-4">Totalt</th>
              <th className="py-2 pr-4">Konfidens</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.submissionId} className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => onSelectStudent(r.submissionId)}>
                <td className="py-2 pr-4 font-medium">{r.studentName}</td>
                <td className="py-2 pr-4">{statusLabel(r.status)}</td>
                <td className="py-2 pr-4">{r.part1ScorePercent !== null ? `${r.part1ScorePercent}%` : '—'}</td>
                <td className="py-2 pr-4">{r.part2ScorePercent !== null ? `${r.part2ScorePercent}%` : '—'}</td>
                <td className="py-2 pr-4 font-semibold">{r.totalScorePercent !== null ? `${r.totalScorePercent}%` : '—'}</td>
                <td className="py-2 pr-4">{confidenceBadge(r.avgConfidence)}</td>
                <td className="py-2"><Button variant="ghost" size="sm">Detaljer →</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button variant="outline" onClick={onExportCsv}>Eksporter til CSV</Button>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3 text-center">
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
