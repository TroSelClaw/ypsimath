'use client'

import { useMemo, useRef, useState } from 'react'

interface FlashcardCardProps {
  frontHtml: string
  backHtml: string
  revealed: boolean
  onReveal: () => void
  onRate: (quality: 5 | 3 | 1) => void
  disabled?: boolean
}

export function FlashcardCard({
  frontHtml,
  backHtml,
  revealed,
  onReveal,
  onRate,
  disabled = false,
}: FlashcardCardProps) {
  const [dragX, setDragX] = useState(0)
  const [dragY, setDragY] = useState(0)
  const [flash, setFlash] = useState<'good' | 'bad' | 'mid' | null>(null)
  const startX = useRef<number | null>(null)
  const startY = useRef<number | null>(null)

  const swipeHint = useMemo(() => {
    if (dragX > 40) return 'Slipp for Husket'
    if (dragX < -40) return 'Slipp for Glemte'
    if (dragY < -40) return 'Slipp for Nesten'
    return 'Sveip: høyre = Husket · venstre = Glemte · opp = Nesten'
  }, [dragX, dragY])

  const flashClass =
    flash === 'good'
      ? 'bg-emerald-200/40'
      : flash === 'bad'
        ? 'bg-red-200/40'
        : flash === 'mid'
          ? 'bg-amber-200/40'
          : ''

  return (
    <div className="space-y-4">
      <button
        type="button"
        className="group relative w-full touch-manipulation overflow-hidden rounded-2xl border bg-card p-0 text-left shadow-sm transition hover:border-primary/40"
        onClick={onReveal}
        onKeyDown={(event) => {
          if (event.code === 'Space') {
            event.preventDefault()
            onReveal()
          }
        }}
        onPointerDown={(event) => {
          startX.current = event.clientX
          startY.current = event.clientY
        }}
        onPointerMove={(event) => {
          if (startX.current == null || startY.current == null) return
          setDragX(event.clientX - startX.current)
          setDragY(event.clientY - startY.current)
        }}
        onPointerUp={() => {
          if (revealed && !disabled) {
            if (dragX > 80) {
              setFlash('good')
              onRate(5)
            } else if (dragX < -80) {
              setFlash('bad')
              onRate(1)
            } else if (dragY < -80) {
              setFlash('mid')
              onRate(3)
            }
          }

          setTimeout(() => setFlash(null), 220)
          setDragX(0)
          setDragY(0)
          startX.current = null
          startY.current = null
        }}
      >
        <div className={`absolute inset-0 pointer-events-none transition ${flashClass}`} />

        <div className="relative min-h-[62svh] [perspective:1000px] sm:min-h-[22rem]">
          <div
            className={`absolute inset-0 transition-transform duration-300 motion-reduce:transition-none [transform-style:preserve-3d] ${revealed ? 'motion-safe:[transform:rotateY(180deg)]' : ''}`}
          >
            <div className="absolute inset-0 [backface-visibility:hidden] p-6">
              <p className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">Forside</p>
              <div className="prose prose-neutral max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: frontHtml }} />
            </div>
            <div className="absolute inset-0 [backface-visibility:hidden] p-6 motion-safe:[transform:rotateY(180deg)]">
              <p className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">Bakside</p>
              <div className="prose prose-neutral max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: backHtml }} />
            </div>
          </div>
        </div>
      </button>

      <p className="text-center text-xs text-muted-foreground">{swipeHint}</p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          type="button"
          disabled={!revealed || disabled}
          onClick={() => onRate(1)}
          className="min-h-12 touch-manipulation rounded-md border border-red-300 px-4 py-3 text-sm font-medium text-red-700 disabled:opacity-50"
        >
          Glemte
        </button>
        <button
          type="button"
          disabled={!revealed || disabled}
          onClick={() => onRate(3)}
          className="min-h-12 touch-manipulation rounded-md border border-amber-300 px-4 py-3 text-sm font-medium text-amber-700 disabled:opacity-50"
        >
          Nesten
        </button>
        <button
          type="button"
          disabled={!revealed || disabled}
          onClick={() => onRate(5)}
          className="min-h-12 touch-manipulation rounded-md border border-emerald-300 px-4 py-3 text-sm font-medium text-emerald-700 disabled:opacity-50"
        >
          Husket
        </button>
      </div>
    </div>
  )
}
