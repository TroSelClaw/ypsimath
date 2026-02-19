'use client'

import type { ReactNode } from 'react'
import type { NavItem } from './nav-items'
import { DesktopSidebar } from './desktop-sidebar'
import { MobileHeader } from './mobile-header'
import { MobileBottomNav } from './mobile-bottom-nav'
import { SearchDialog } from '@/components/search/search-dialog'
import { FeedbackButton } from '@/components/feedback/feedback-button'

export interface AppShellProfile {
  id: string
  display_name: string
  role: string
}

interface AppShellProps {
  children: ReactNode
  profile: AppShellProfile
  navItems: NavItem[]
}

export function AppShell({ children, profile, navItems }: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      <DesktopSidebar profile={profile} navItems={navItems} />
      <div className="flex flex-1 flex-col">
        <MobileHeader profile={profile} />
        <div className="flex items-center justify-end px-4 pt-3 md:px-6">
          <SearchDialog />
        </div>
        <main className="flex-1 p-4 pb-20 md:p-6 md:pb-6">{children}</main>
        <FeedbackButton />
        <MobileBottomNav navItems={navItems} />
      </div>
    </div>
  )
}
