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
  const startX = useRef<number | null>(null)

  const swipeHint = useMemo(() => {
    if (dragX > 40) return 'Slipp for Husket'
    if (dragX < -40) return 'Slipp for Glemte'
    return 'Sveip høyre: Husket · venstre: Glemte'
  }, [dragX])

  return (
    <div className="space-y-4">
      <button
        type="button"
        className="w-full rounded-2xl border bg-card p-6 text-left shadow-sm transition hover:border-primary/40"
        onClick={onReveal}
        onKeyDown={(event) => {
          if (event.code === 'Space') {
            event.preventDefault()
            onReveal()
          }
        }}
        onPointerDown={(event) => {
          startX.current = event.clientX
        }}
        onPointerMove={(event) => {
          if (startX.current == null) return
          setDragX(event.clientX - startX.current)
        }}
        onPointerUp={() => {
          if (dragX > 80 && revealed && !disabled) onRate(5)
          if (dragX < -80 && revealed && !disabled) onRate(1)
          setDragX(0)
          startX.current = null
        }}
      >
        <p className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">{revealed ? 'Bakside' : 'Forside'}</p>
        <div
          className="prose prose-neutral max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: revealed ? backHtml : frontHtml }}
        />
      </button>

      <p className="text-center text-xs text-muted-foreground">{swipeHint}</p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          type="button"
          disabled={!revealed || disabled}
          onClick={() => onRate(1)}
          className="rounded-md border border-red-300 px-4 py-3 text-sm font-medium text-red-700 disabled:opacity-50"
        >
          Glemte
        </button>
        <button
          type="button"
          disabled={!revealed || disabled}
          onClick={() => onRate(3)}
          className="rounded-md border border-amber-300 px-4 py-3 text-sm font-medium text-amber-700 disabled:opacity-50"
        >
          Nesten
        </button>
        <button
          type="button"
          disabled={!revealed || disabled}
          onClick={() => onRate(5)}
          className="rounded-md border border-emerald-300 px-4 py-3 text-sm font-medium text-emerald-700 disabled:opacity-50"
        >
          Husket
        </button>
      </div>
    </div>
  )
}
