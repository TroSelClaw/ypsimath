'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface ConversationItem {
  id: string
  title: string
  updated_at: string
}

interface ConversationSidebarProps {
  conversations: ConversationItem[]
}

export function ConversationSidebar({
  conversations,
}: ConversationSidebarProps) {
  const pathname = usePathname()

  return (
    <div className="hidden w-64 flex-col border-r border-border bg-muted/30 lg:flex">
      <div className="p-3">
        <Button asChild variant="outline" className="w-full justify-start gap-2">
          <Link href="/chat">
            <Plus className="h-4 w-4" />
            Ny samtale
          </Link>
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
        {conversations.map((conv) => {
          const active = pathname === `/chat/${conv.id}`
          return (
            <Link
              key={conv.id}
              href={`/chat/${conv.id}`}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50',
              )}
            >
              <MessageSquare className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{conv.title}</span>
            </Link>
          )
        })}
        {conversations.length === 0 && (
          <p className="px-3 py-4 text-center text-xs text-muted-foreground">
            Ingen samtaler ennå
          </p>
        )}
      </div>
    </div>
  )
}
