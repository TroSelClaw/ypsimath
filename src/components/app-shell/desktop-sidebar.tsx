'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from './nav-items'
import { ThemeToggle } from './theme-toggle'
import { Separator } from '@/components/ui/separator'

export function DesktopSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-border bg-sidebar text-sidebar-foreground h-screen sticky top-0">
      {/* Brand */}
      <div className="flex h-14 items-center px-4 font-semibold text-lg tracking-tight">
        <span className="text-primary">Ypsi</span>Math
      </div>

      <Separator />

      {/* Nav links */}
      <nav className="flex-1 space-y-1 px-2 py-3" aria-label="Hovednavigasjon">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
              )}
              aria-current={active ? 'page' : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom: theme toggle */}
      <div className="border-t border-border p-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Tema</span>
        <ThemeToggle />
      </div>
    </aside>
  )
}
