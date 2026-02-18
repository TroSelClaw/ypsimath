'use client'

import type { ReactNode } from 'react'
import { DesktopSidebar } from './desktop-sidebar'
import { MobileHeader } from './mobile-header'
import { MobileBottomNav } from './mobile-bottom-nav'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <DesktopSidebar />
      <div className="flex flex-1 flex-col">
        <MobileHeader />
        <main className="flex-1 p-4 pb-20 md:p-6 md:pb-6">{children}</main>
        <MobileBottomNav />
      </div>
    </div>
  )
}
