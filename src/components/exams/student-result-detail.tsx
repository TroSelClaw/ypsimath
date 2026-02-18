'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MathContent } from '@/components/content/math-content'

export interface AnswerDetail {
  answerId: string
  questionId: string
  part: number
  questionNumber: number
  questionContent: string
  maxPoints: number
  studentAnswerText: string
  scorePercent: number
  confidenceScore: number
  errorAnalysis: {
    fortegnsfeil: boolean
    konseptfeil: boolean
    regnefeil: boolean
    manglende_steg: boolean
    details: string
  }
  llmFeedback: string
  teacherOverride: boolean
}

interface Props {
  studentName: string
  totalScorePercent: number
  answers: AnswerDetail[]
  onOverrideScore: (answerId: string, newScorePercent: number) => void
  onBack: () => void
}

function errorTags(analysis: AnswerDetail['errorAnalysis']) {
  const tags: string[] = []
  if (analysis.fortegnsfeil) tags.push('Fortegnsfeil')
  if (analysis.konseptfeil) tags.push('Konseptfeil')
  if (analysis.regnefeil) tags.push('Regnefeil')
  if (analysis.manglende_steg) tags.push('Manglende steg')
  return tags
}

export function StudentResultDetail({ studentName, totalScorePercent, answers, onOverrideScore, onBack }: Props) {
  const [overrides, setOverrides] = useState<Record<string, string>>({})

  const handleOverride = (answerId: string) => {
    const value = overrides[answerId]
    if (value === undefined) return
    const num = Number(value)
    if (isNaN(num) || num < 0 || num > 100) return
    onOverrideScore(answerId, num)
  }

  const part1 = answers.filter((a) => a.part === 1)
  const part2 = answers.filter((a) => a.part === 2)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{studentName}</h2>
          <p className="text-muted-foreground">Totalt: {totalScorePercent}%</p>
        </div>
        <Button variant="outline" onClick={onBack}>← Tilbake</Button>
      </div>

      {[
        { label: 'Del 1 — Uten hjelpemidler', items: part1 },
        { label: 'Del 2 — Med hjelpemidler', items: part2 },
      ].map(({ label, items }) => (
        items.length > 0 && (
          <div key={label} className="space-y-4">
            <h3 className="text-lg font-semibold">{label}</h3>
            {items.map((a) => (
              <Card key={a.answerId} className={a.confidenceScore < 70 ? 'border-yellow-500' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Oppgave {a.questionNumber} ({a.maxPoints} poeng)
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{a.scorePercent}%</span>
                      {a.confidenceScore < 70 && <Badge variant="destructive">Lav konfidens ⚠️</Badge>}
                      {a.teacherOverride && <Badge variant="outline">Overstyrt</Badge>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Oppgave:</p>
                    <MathContent content={a.questionContent} />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Elevens svar (OCR):</p>
                    <div className="rounded bg-muted p-3 text-sm whitespace-pre-wrap">
                      <MathContent content={a.studentAnswerText || '*Tomt / ikke besvart*'} />
                    </div>
                  </div>

                  {/* Error tags */}
                  {errorTags(a.errorAnalysis).length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {errorTags(a.errorAnalysis).map((tag) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  )}

                  {a.errorAnalysis.details && (
                    <p className="text-sm text-muted-foreground">{a.errorAnalysis.details}</p>
                  )}

                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">AI-tilbakemelding:</p>
                    <p className="text-sm">{a.llmFeedback}</p>
                  </div>

                  {/* Override */}
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="Ny score %"
                      className="w-28"
                      value={overrides[a.answerId] ?? ''}
                      onChange={(e) => setOverrides((p) => ({ ...p, [a.answerId]: e.target.value }))}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOverride(a.answerId)}
                      disabled={!overrides[a.answerId]}
                    >
                      Overstyr
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ))}
    </div>
  )
}
