'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { NavItem } from './nav-items'

interface Props {
  navItems: NavItem[]
}

export function MobileBottomNav({ navItems }: Props) {
  const pathname = usePathname()
  // Show max 5 items in mobile nav
  const items = navItems.slice(0, 5)

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-background md:hidden"
      aria-label="Mobilnavigasjon"
    >
      {items.map((item) => {
        const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors',
              active ? 'text-primary' : 'text-muted-foreground',
            )}
            aria-current={active ? 'page' : undefined}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
