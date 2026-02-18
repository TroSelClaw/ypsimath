'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { createExamInputSchema, type CreateExamInput } from '@/lib/schemas/exams'

const R1_GOALS = [
  { code: 'R1-01', label: 'Grenseverdier og kontinuitet' },
  { code: 'R1-02', label: 'Derivasjon — definisjon og tolkning' },
  { code: 'R1-03', label: 'Derivasjonsregler' },
  { code: 'R1-04', label: 'Kjerneregelen' },
  { code: 'R1-05', label: 'Implisitt derivasjon' },
  { code: 'R1-06', label: 'Funksjonsdrøfting' },
  { code: 'R1-07', label: 'Optimering' },
  { code: 'R1-08', label: 'Integrasjon — ubestemt' },
  { code: 'R1-09', label: 'Bestemt integral og areal' },
  { code: 'R1-10', label: 'Volum av omdreiningslegemer' },
  { code: 'R1-11', label: 'Differensiallikninger' },
  { code: 'R1-12', label: 'Vektorer i planet' },
]

type ExamQuestion = {
  id: string
  part: number
  question_number: number
  content: string
  max_points: number
  solution: string
}

const SCORE: Record<'fikk_til' | 'delvis' | 'fikk_ikke_til', number> = {
  fikk_til: 1,
  delvis: 0.5,
  fikk_ikke_til: 0,
}

export function PracticeExam() {
  const router = useRouter()
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [duration, setDuration] = useState(60)
  const [difficulty, setDifficulty] = useState<'lett' | 'middels' | 'vanskelig'>('middels')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [examId, setExamId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [mode, setMode] = useState<'setup' | 'choice' | 'interactive' | 'done'>('setup')
  const [index, setIndex] = useState(0)
  const [showSolution, setShowSolution] = useState(false)
  const [answers, setAnswers] = useState<Record<string, 'fikk_til' | 'delvis' | 'fikk_ikke_til'>>({})

  const toggleGoal = (code: string) => {
    setSelectedGoals((prev) =>
      prev.includes(code) ? prev.filter((g) => g !== code) : [...prev, code],
    )
  }

  const difficultyMix = useMemo(() => {
    if (difficulty === 'lett') return { easy: 60, medium: 30, hard: 10 }
    if (difficulty === 'vanskelig') return { easy: 10, medium: 30, hard: 60 }
    return { easy: 30, medium: 50, hard: 20 }
  }, [difficulty])

  const currentQuestion = questions[index]

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const input: CreateExamInput = {
      title: `Øvingsprøve (${duration} min)`,
      subject_id: 'r1',
      total_duration_minutes: duration,
      part1_duration_minutes: Math.max(10, Math.round(duration * 0.4)),
      part2_duration_minutes: Math.max(10, duration - Math.max(10, Math.round(duration * 0.4))),
      competency_goals: selectedGoals,
      difficulty_mix: difficultyMix,
    }

    const validation = createExamInputSchema.safeParse(input)
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? 'Ugyldig input.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/exams/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...input, examType: 'practice' }),
      })

      const body = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(body?.error ?? 'Kunne ikke generere øvingsprøve.')
      }

      setExamId(body.examId)
      setQuestions((body.questions as ExamQuestion[]) ?? [])
      setMode('choice')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Noe gikk galt. Prøv igjen.')
    } finally {
      setLoading(false)
    }
  }

  const submitSelfReport = async () => {
    if (!examId || questions.length === 0) return

    const totalWeight = questions.reduce((sum, q) => sum + Number(q.max_points), 0)
    const earned = questions.reduce((sum, q) => {
      const rating = answers[q.id]
      return sum + Number(q.max_points) * (rating ? SCORE[rating] : 0)
    }, 0)

    const percent = totalWeight > 0 ? Math.round((earned / totalWeight) * 100) : 0

    setLoading(true)
    try {
      const res = await fetch(`/api/exams/${examId}/practice-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total_score_percent: percent,
          answers,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? 'Kunne ikke lagre resultat.')
      }

      setMode('done')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke lagre resultat.')
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'setup') {
    return (
      <form onSubmit={handleGenerate} className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Lag øvingsprøve</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Varighet</Label>
              <div className="flex gap-2">
                {[30, 45, 60, 90].map((d) => (
                  <Button
                    key={d}
                    type="button"
                    variant={duration === d ? 'default' : 'outline'}
                    onClick={() => setDuration(d)}
                  >
                    {d} min
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Vanskelighetsgrad</Label>
              <select
                id="difficulty"
                className="h-9 rounded-md border bg-background px-3 text-sm"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
              >
                <option value="lett">Lett</option>
                <option value="middels">Middels</option>
                <option value="vanskelig">Vanskelig</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Kompetansemål</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {R1_GOALS.map((goal) => (
                  <label
                    key={goal.code}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedGoals.includes(goal.code)}
                      onCheckedChange={() => toggleGoal(goal.code)}
                    />
                    <span className="font-mono text-xs text-muted-foreground">{goal.code}</span>
                    <span>{goal.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button type="submit" disabled={loading || selectedGoals.length === 0}>
          {loading ? 'Genererer…' : 'Generer øvingsprøve'}
        </Button>
      </form>
    )
  }

  if (mode === 'choice' && examId) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Øvingsprøven er klar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Velg hvordan du vil jobbe med prøven.</p>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <a href={`/api/exams/${examId}/pdf?type=exam`}>Last ned PDF</a>
              </Button>
              <Button variant="outline" onClick={() => setMode('interactive')}>
                Svar digitalt
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (mode === 'done') {
    const totalWeight = questions.reduce((sum, q) => sum + Number(q.max_points), 0)
    const earned = questions.reduce((sum, q) => {
      const rating = answers[q.id]
      return sum + Number(q.max_points) * (rating ? SCORE[rating] : 0)
    }, 0)
    const percent = totalWeight > 0 ? Math.round((earned / totalWeight) * 100) : 0

    return (
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Ferdig 🎉</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>Selvrapportert score: <strong>{percent}%</strong></p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Lag ny øvingsprøve
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!currentQuestion) return null

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Øvingsprøve — digital modus</h2>
        <Badge variant="outline">
          Oppgave {index + 1} av {questions.length}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Del {currentQuestion.part} · Oppgave {currentQuestion.question_number}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="whitespace-pre-wrap text-sm leading-6">{currentQuestion.content}</div>

          {!showSolution ? (
            <Button variant="outline" onClick={() => setShowSolution(true)}>
              Vis løsning
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="rounded-md border bg-muted/40 p-3">
                <p className="text-xs font-medium mb-1">Løsningsforslag</p>
                <div className="whitespace-pre-wrap text-sm">{currentQuestion.solution}</div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: 'fikk_til' }))
                    setShowSolution(false)
                    if (index + 1 < questions.length) setIndex((i) => i + 1)
                    else void submitSelfReport()
                  }}
                >
                  Fikk til
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: 'delvis' }))
                    setShowSolution(false)
                    if (index + 1 < questions.length) setIndex((i) => i + 1)
                    else void submitSelfReport()
                  }}
                >
                  Delvis
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: 'fikk_ikke_til' }))
                    setShowSolution(false)
                    if (index + 1 < questions.length) setIndex((i) => i + 1)
                    else void submitSelfReport()
                  }}
                >
                  Fikk ikke til
                </Button>
              </div>
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
