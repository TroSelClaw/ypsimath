'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ResultsTable, type StudentResult } from './results-table'
import { StudentResultDetail, type AnswerDetail } from './student-result-detail'
import { overrideExamAnswerScore } from '@/app/actions/exam-results'

interface Props {
  examId: string
  title: string
  initialResults: StudentResult[]
  detailsBySubmission: Record<string, { studentName: string; totalScorePercent: number; answers: AnswerDetail[] }>
}

export function ExamResultsView({ examId, title, initialResults, detailsBySubmission }: Props) {
  const [results, setResults] = useState(initialResults)
  const [details, setDetails] = useState(detailsBySubmission)
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // Realtime: refresh when grading updates come in
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`exam-results-${examId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exam_submissions',
          filter: `exam_id=eq.${examId}`,
        },
        () => {
          router.refresh()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [examId, router])

  const selected = selectedSubmissionId ? details[selectedSubmissionId] : null

  async function handleOverride(answerId: string, newScorePercent: number) {
    if (!selectedSubmissionId) return

    const previousDetails = details

    // Optimistic update in selected detail
    setDetails((prev) => {
      const current = prev[selectedSubmissionId]
      if (!current) return prev
      const updatedAnswers = current.answers.map((a) =>
        a.answerId === answerId ? { ...a, scorePercent: newScorePercent, teacherOverride: true } : a,
      )

      const totalScorePercent = computeWeightedTotal(updatedAnswers)

      return {
        ...prev,
        [selectedSubmissionId]: {
          ...current,
          answers: updatedAnswers,
          totalScorePercent,
        },
      }
    })

    // Optimistic update in list
    setResults((prev) =>
      prev.map((r) =>
        r.submissionId === selectedSubmissionId
          ? { ...r, totalScorePercent: details[selectedSubmissionId] ? computeWeightedTotal(details[selectedSubmissionId].answers.map((a) => a.answerId === answerId ? { ...a, scorePercent: newScorePercent, teacherOverride: true } : a)) : r.totalScorePercent }
          : r,
      ),
    )

    startTransition(async () => {
      const result = await overrideExamAnswerScore({
        examId,
        answerId,
        newScorePercent,
      })

      if (result.error) {
        setDetails(previousDetails)
      } else {
        router.refresh()
      }
    })
  }

  function exportCsv() {
    const rows = [
      ['Navn', 'E-post', 'Status', 'Del 1 (%)', 'Del 2 (%)', 'Total (%)', 'Konfidens'],
      ...results.map((r) => [
        r.studentName,
        r.studentEmail,
        r.status,
        r.part1ScorePercent?.toString() ?? '',
        r.part2ScorePercent?.toString() ?? '',
        r.totalScorePercent?.toString() ?? '',
        r.avgConfidence?.toString() ?? '',
      ]),
    ]

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `proveresultater-${examId}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Resultater: {title}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Klasseoversikt, per-elev detaljvisning og overstyring av AI-score.
          {isPending ? ' Lagrer endring…' : ''}
        </p>
      </div>

      {selected && selectedSubmissionId ? (
        <StudentResultDetail
          studentName={selected.studentName}
          totalScorePercent={selected.totalScorePercent}
          answers={selected.answers}
          onOverrideScore={handleOverride}
          onBack={() => setSelectedSubmissionId(null)}
        />
      ) : (
        <ResultsTable
          results={results}
          onSelectStudent={setSelectedSubmissionId}
          onExportCsv={exportCsv}
        />
      )}
    </div>
  )
}

function computeWeightedTotal(answers: AnswerDetail[]) {
  const max = answers.reduce((sum, a) => sum + a.maxPoints, 0)
  if (max === 0) return 0
  const earned = answers.reduce((sum, a) => sum + (a.maxPoints * a.scorePercent) / 100, 0)
  return Math.round((earned / max) * 100)
}
