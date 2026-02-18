'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon, Accessibility } from 'lucide-react'
import { Button } from '@/components/ui/button'

const CYCLE: Array<{ theme: string; icon: typeof Sun; label: string }> = [
  { theme: 'light', icon: Sun, label: 'Lyst tema' },
  { theme: 'dark', icon: Moon, label: 'Mørkt tema' },
  { theme: 'uu', icon: Accessibility, label: 'UU-modus (høy kontrast)' },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Bytt tema" disabled>
        <Sun className="h-4 w-4" />
      </Button>
    )
  }

  const currentIndex = CYCLE.findIndex((c) => c.theme === theme)
  const next = CYCLE[(currentIndex + 1) % CYCLE.length]
  const current = CYCLE[currentIndex >= 0 ? currentIndex : 0]
  const Icon = current.icon

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Tema: ${current.label}. Klikk for ${next.label}`}
      onClick={() => setTheme(next.theme)}
    >
      <Icon className="h-4 w-4" />
    </Button>
  )
}
