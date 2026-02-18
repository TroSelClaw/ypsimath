'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { MathContent } from '@/components/content/math-content'
import { Pencil, Trash2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'

interface ExamQuestion {
  id: string
  part: number
  question_number: number
  content: string
  max_points: number
  solution: string
  grading_criteria: string
}

interface QuestionEditorProps {
  question: ExamQuestion
  onUpdate: (updates: Partial<ExamQuestion>) => void
  onDelete: () => void
  onRegenerate: () => void
}

export function QuestionEditor({ question, onUpdate, onDelete, onRegenerate }: QuestionEditorProps) {
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(question.content)
  const [editPoints, setEditPoints] = useState(question.max_points)
  const [showSolution, setShowSolution] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [editing])

  const handleSave = () => {
    onUpdate({ content: editContent, max_points: editPoints })
    setEditing(false)
  }

  const handleContentChange = (value: string) => {
    setEditContent(value)
    // Debounced auto-save
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      onUpdate({ content: value })
    }, 2000)
  }

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">
            Oppgave {question.question_number}
          </span>
          <div className="flex items-center gap-1">
            {editing ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={editPoints}
                  onChange={(e) => setEditPoints(Number(e.target.value))}
                  className="w-16 h-7 text-xs"
                  min={1}
                />
                <span className="text-xs text-muted-foreground">poeng</span>
                <Button size="sm" variant="default" onClick={handleSave} className="h-7 text-xs">
                  Lagre
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setEditContent(question.content) }} className="h-7 text-xs">
                  Avbryt
                </Button>
              </div>
            ) : (
              <>
                <span className="text-xs text-muted-foreground mr-2">{question.max_points}p</span>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(true)} title="Rediger">
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onRegenerate} title="Regenerer oppgave">
                  <RefreshCw className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={onDelete} title="Slett">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        {editing ? (
          <div className="space-y-2">
            <textarea
              ref={textareaRef}
              value={editContent}
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full min-h-[120px] rounded-md border bg-background p-3 text-sm font-mono resize-y"
            />
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground mb-1">Forhåndsvisning:</p>
              <MathContent content={editContent} />
            </div>
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <MathContent content={question.content} />
          </div>
        )}

        {/* Solution toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => setShowSolution(!showSolution)}
        >
          {showSolution ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
          {showSolution ? 'Skjul løsning' : 'Vis løsning'}
        </Button>

        {showSolution && (
          <div className="space-y-2 border-t pt-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Løsning:</p>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <MathContent content={question.solution} />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Vurderingskriterier:</p>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <MathContent content={question.grading_criteria} />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
