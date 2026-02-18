'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useRef, useCallback, useMemo } from 'react'
import { Plus, MessageSquare, Search, Pencil, Trash2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { renameConversation, deleteConversation } from '@/app/actions/conversations'

export interface ConversationItem {
  id: string
  title: string
  updated_at: string
}

interface ConversationSidebarProps {
  conversations: ConversationItem[]
}

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMin = Math.floor((now - then) / 60_000)
  if (diffMin < 1) return 'nå'
  if (diffMin < 60) return `${diffMin} min siden`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}t siden`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `${diffD}d siden`
  return new Date(dateStr).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })
}

export function ConversationSidebar({ conversations }: ConversationSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<ConversationItem | null>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations
    const q = search.toLowerCase()
    return conversations.filter((c) => c.title.toLowerCase().includes(q))
  }, [conversations, search])

  const startRename = useCallback((conv: ConversationItem) => {
    setEditingId(conv.id)
    setEditTitle(conv.title)
    setTimeout(() => editInputRef.current?.focus(), 50)
  }, [])

  const submitRename = useCallback(
    async (convId: string) => {
      if (!editTitle.trim()) {
        setEditingId(null)
        return
      }
      const fd = new FormData()
      fd.set('conversationId', convId)
      fd.set('title', editTitle.trim())
      await renameConversation(fd)
      setEditingId(null)
    },
    [editTitle],
  )

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return
    const fd = new FormData()
    fd.set('conversationId', deleteTarget.id)
    await deleteConversation(fd)
    setDeleteTarget(null)
    if (pathname === `/chat/${deleteTarget.id}`) {
      router.push('/chat')
    }
  }, [deleteTarget, pathname, router])

  return (
    <div className="hidden w-64 flex-col border-r border-border bg-muted/30 lg:flex">
      <div className="p-3 space-y-2">
        <Button asChild variant="outline" className="w-full justify-start gap-2">
          <Link href="/chat">
            <Plus className="h-4 w-4" />
            Ny samtale
          </Link>
        </Button>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Søk i samtaler…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
        {filtered.map((conv) => {
          const active = pathname === `/chat/${conv.id}`
          const isEditing = editingId === conv.id

          if (isEditing) {
            return (
              <div key={conv.id} className="flex items-center gap-1 px-1 py-1">
                <Input
                  ref={editInputRef}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitRename(conv.id)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  className="h-7 text-xs flex-1"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => submitRename(conv.id)}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => setEditingId(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )
          }

          return (
            <div
              key={conv.id}
              className={cn(
                'group flex items-center gap-1 rounded-md transition-colors',
                active
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50',
              )}
            >
              <Link
                href={`/chat/${conv.id}`}
                className="flex flex-1 items-center gap-2 px-3 py-2 min-w-0"
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="block truncate text-sm">{conv.title}</span>
                  <span className="block truncate text-[10px] text-muted-foreground/70">
                    {relativeTime(conv.updated_at)}
                  </span>
                </div>
              </Link>
              <div className="hidden group-hover:flex items-center gap-0.5 pr-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.preventDefault()
                    startRename(conv)
                  }}
                  title="Gi nytt navn"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.preventDefault()
                    setDeleteTarget(conv)
                  }}
                  title="Slett"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && conversations.length > 0 && (
          <p className="px-3 py-4 text-center text-xs text-muted-foreground">
            Ingen treff
          </p>
        )}
        {conversations.length === 0 && (
          <p className="px-3 py-4 text-center text-xs text-muted-foreground">
            Ingen samtaler ennå
          </p>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open: boolean) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett samtale?</AlertDialogTitle>
            <AlertDialogDescription>
              &laquo;{deleteTarget?.title}&raquo; vil bli slettet. Du kan ikke angre dette.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Slett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
