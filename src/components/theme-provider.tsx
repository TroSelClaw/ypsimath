'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ReactNode } from 'react'

// Three themes: dark (default), light, uu (high-contrast accessibility)
const THEMES = ['dark', 'light', 'uu'] as const
export type Theme = (typeof THEMES)[number]

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      themes={[...THEMES]}
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
