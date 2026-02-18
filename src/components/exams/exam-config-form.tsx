'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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

export function ExamConfigForm() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [totalDuration, setTotalDuration] = useState(300)
  const [part1Duration, setPart1Duration] = useState(120)
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [easy, setEasy] = useState(30)
  const [medium, setMedium] = useState(50)
  const [hard, setHard] = useState(20)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const part2Duration = totalDuration - part1Duration
  const estimatedQuestions = Math.round(totalDuration / 20)
  const difficultySum = easy + medium + hard

  const toggleGoal = (code: string) => {
    setSelectedGoals((prev) =>
      prev.includes(code) ? prev.filter((g) => g !== code) : [...prev, code],
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const input: CreateExamInput = {
      title,
      subject_id: 'r1',
      total_duration_minutes: totalDuration,
      part1_duration_minutes: part1Duration,
      part2_duration_minutes: part2Duration,
      competency_goals: selectedGoals,
      difficulty_mix: { easy, medium, hard },
    }

    const validation = createExamInputSchema.safeParse(input)
    if (!validation.success) {
      const firstIssue = validation.error.issues[0]
      setError(firstIssue?.message ?? 'Valideringsfeil.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/exams/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? `Feil (${res.status})`)
      }

      const { examId } = await res.json()
      router.push(`/laerer/prover/${examId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Noe gikk galt. Prøv igjen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Tittel</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="F.eks. Kapittelprøve derivasjon"
          required
        />
      </div>

      {/* Duration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tidsinndeling</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalDuration">Total varighet (min)</Label>
              <Input
                id="totalDuration"
                type="number"
                min={30}
                max={300}
                value={totalDuration}
                onChange={(e) => setTotalDuration(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="part1Duration">Del 1 — uten hjelpemidler (min)</Label>
              <Input
                id="part1Duration"
                type="number"
                min={10}
                max={totalDuration - 10}
                value={part1Duration}
                onChange={(e) => setPart1Duration(Number(e.target.value))}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Del 2 (med hjelpemidler): <strong>{part2Duration} min</strong> · Estimert{' '}
            <strong>~{estimatedQuestions} oppgaver</strong>
          </p>
        </CardContent>
      </Card>

      {/* Competency Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kompetansemål</CardTitle>
        </CardHeader>
        <CardContent>
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
          {selectedGoals.length === 0 && (
            <p className="text-sm text-destructive mt-2">Velg minst ett kompetansemål.</p>
          )}
        </CardContent>
      </Card>

      {/* Difficulty Mix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vanskelighetsfordeling</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="easy">Lett (%)</Label>
              <Input
                id="easy"
                type="number"
                min={0}
                max={100}
                value={easy}
                onChange={(e) => setEasy(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="medium">Middels (%)</Label>
              <Input
                id="medium"
                type="number"
                min={0}
                max={100}
                value={medium}
                onChange={(e) => setMedium(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="hard">Vanskelig (%)</Label>
              <Input
                id="hard"
                type="number"
                min={0}
                max={100}
                value={hard}
                onChange={(e) => setHard(Number(e.target.value))}
              />
            </div>
          </div>
          {difficultySum !== 100 && (
            <p className="text-sm text-destructive">
              Summen er {difficultySum}% — må være 100%.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Submit */}
      <Button type="submit" disabled={loading || selectedGoals.length === 0 || difficultySum !== 100} className="w-full">
        {loading ? 'Genererer prøve…' : 'Generer prøve'}
      </Button>
    </form>
  )
}
