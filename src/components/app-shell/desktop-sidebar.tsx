'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { NavItem } from './nav-items'
import type { AppShellProfile } from './app-shell'
import { ThemeToggle } from './theme-toggle'
import { Separator } from '@/components/ui/separator'
import { signOut } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'

interface Props {
  profile: AppShellProfile
  navItems: NavItem[]
}

export function DesktopSidebar({ profile, navItems }: Props) {
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
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
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
              <span className="text-base shrink-0">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom: user info + theme + logout */}
      <div className="border-t border-border p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{profile.display_name}</p>
            <p className="text-xs text-muted-foreground capitalize">{profile.role}</p>
          </div>
          <ThemeToggle />
        </div>
        <form action={signOut}>
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" type="submit">
            Logg ut
          </Button>
        </form>
      </div>
    </aside>
  )
}
