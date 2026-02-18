'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { QuestionEditor } from './question-editor'
import { GripVertical, Plus, Check } from 'lucide-react'

interface ExamQuestion {
  id: string
  exam_id: string
  part: number
  question_number: number
  content: string
  max_points: number
  solution: string
  grading_criteria: string
}

interface Exam {
  id: string
  title: string
  status: string
  total_duration_minutes: number
  part1_duration_minutes: number
  part2_duration_minutes: number
  competency_goals: string[]
}

interface ExamPreviewProps {
  exam: Exam
  initialQuestions: ExamQuestion[]
}

export function ExamPreview({ exam, initialQuestions }: ExamPreviewProps) {
  const router = useRouter()
  const [questions, setQuestions] = useState(initialQuestions)
  const [saving, setSaving] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  const part1 = questions.filter((q) => q.part === 1)
  const part2 = questions.filter((q) => q.part === 2)
  const totalPoints = questions.reduce((s, q) => s + q.max_points, 0)

  const updateQuestion = useCallback(
    async (questionId: string, updates: Partial<ExamQuestion>) => {
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, ...updates } : q)),
      )

      // Auto-save via API
      try {
        await fetch(`/api/exams/${exam.id}/questions/${questionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })
      } catch {
        console.error('Failed to save question update')
      }
    },
    [exam.id],
  )

  const deleteQuestion = useCallback(
    async (questionId: string) => {
      setQuestions((prev) => prev.filter((q) => q.id !== questionId))
      try {
        await fetch(`/api/exams/${exam.id}/questions/${questionId}`, {
          method: 'DELETE',
        })
      } catch {
        console.error('Failed to delete question')
      }
    },
    [exam.id],
  )

  const regenerateQuestion = useCallback(
    async (questionId: string) => {
      setSaving(true)
      try {
        const res = await fetch(`/api/exams/${exam.id}/questions/${questionId}/regenerate`, {
          method: 'POST',
        })
        if (res.ok) {
          const { question } = await res.json()
          setQuestions((prev) =>
            prev.map((q) => (q.id === questionId ? { ...q, ...question } : q)),
          )
        }
      } catch {
        console.error('Failed to regenerate question')
      } finally {
        setSaving(false)
      }
    },
    [exam.id],
  )

  const markAsReady = useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/exams/${exam.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ready' }),
      })
      if (res.ok) {
        setStatusMsg('Prøven er merket som klar.')
        router.refresh()
      }
    } catch {
      console.error('Failed to update status')
    } finally {
      setSaving(false)
    }
  }, [exam.id, router])

  const renderQuestionList = (qs: ExamQuestion[], partLabel: string, partDuration: number) => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">{partLabel}</h2>
        <Badge variant="secondary">{partDuration} min</Badge>
        <Badge variant="outline">{qs.length} oppgaver</Badge>
      </div>
      {qs.map((q) => (
        <div key={q.id} className="flex gap-2">
          <div className="pt-3 text-muted-foreground cursor-grab">
            <GripVertical className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <QuestionEditor
              question={q}
              onUpdate={(updates) => updateQuestion(q.id, updates)}
              onDelete={() => deleteQuestion(q.id)}
              onRegenerate={() => regenerateQuestion(q.id)}
            />
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{exam.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {exam.total_duration_minutes} min · {questions.length} oppgaver · {totalPoints} poeng ·{' '}
            <Badge variant={exam.status === 'ready' ? 'default' : 'secondary'}>
              {exam.status === 'draft' ? 'Kladd' : exam.status === 'ready' ? 'Klar' : exam.status}
            </Badge>
          </p>
        </div>
        {exam.status === 'draft' && (
          <Button onClick={markAsReady} disabled={saving}>
            <Check className="h-4 w-4 mr-2" />
            Marker som klar
          </Button>
        )}
      </div>

      {statusMsg && (
        <div className="rounded-md bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-700 dark:text-green-400">
          {statusMsg}
        </div>
      )}

      {/* Part 1 */}
      {renderQuestionList(part1, 'Del 1 — Uten hjelpemidler', exam.part1_duration_minutes)}

      {/* Part 2 */}
      {renderQuestionList(part2, 'Del 2 — Med hjelpemidler', exam.part2_duration_minutes)}
    </div>
  )
}
