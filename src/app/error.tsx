'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-bold">Noe gikk galt</h1>
      <p className="text-muted-foreground max-w-md">
        En uventet feil oppstod. Prøv igjen, eller kontakt læreren din hvis problemet vedvarer.
      </p>
      <Button onClick={reset}>Prøv igjen</Button>
    </div>
  )
}
