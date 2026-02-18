'use client'

import type { AppShellProfile } from './app-shell'
import { ThemeToggle } from './theme-toggle'

interface Props {
  profile: AppShellProfile
}

export function MobileHeader({ profile }: Props) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-4 md:hidden">
      <span className="font-semibold text-lg tracking-tight">
        <span className="text-primary">Ypsi</span>Math
      </span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{profile.display_name}</span>
        <ThemeToggle />
      </div>
    </header>
  )
}
