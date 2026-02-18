import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground max-w-md">
        Siden du leter etter finnes ikke. Sjekk adressen eller gå tilbake til forsiden.
      </p>
      <Button asChild>
        <Link href="/">Tilbake til forsiden</Link>
      </Button>
    </div>
  )
}
