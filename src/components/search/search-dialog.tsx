'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, FileText, BookOpen, Calculator, Lightbulb } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface SearchResult {
  id: string
  subject_id: string
  chapter: string
  topic: string
  content_type: string
  content: string
  competency_goals: string[]
  rank: number
}

const TYPE_LABELS: Record<string, { label: string; icon: typeof FileText }> = {
  theory: { label: 'Teori', icon: BookOpen },
  rule: { label: 'Regler', icon: FileText },
  example: { label: 'Eksempler', icon: Lightbulb },
  exercise: { label: 'Oppgaver', icon: Calculator },
  exploration: { label: 'Utforskninger', icon: Lightbulb },
  flashcard: { label: 'Flashcards', icon: FileText },
}

export function SearchDialog() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [grouped, setGrouped] = useState<Record<string, SearchResult[]>>({})
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Cmd/Ctrl+K shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      setGrouped({})
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=20`)
      const data = await res.json()
      setResults(data.results ?? [])
      setGrouped(data.grouped ?? {})
      setSelectedIndex(0)
    } catch {
      setResults([])
      setGrouped({})
    } finally {
      setLoading(false)
    }
  }, [])

  function handleInputChange(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(value), 250)
  }

  function navigateToResult(result: SearchResult) {
    setOpen(false)
    setQuery('')
    setResults([])
    router.push(`/wiki/${result.subject_id}/${result.topic}#${result.id}`)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault()
      navigateToResult(results[selectedIndex])
    }
  }

  // Strip markdown/latex for preview
  function stripContent(content: string): string {
    return content
      .replace(/\$\$[\s\S]*?\$\$/g, '[formel]')
      .replace(/\$[^$]+\$/g, '[formel]')
      .replace(/[#*_`~>]/g, '')
      .replace(/\n+/g, ' ')
      .trim()
      .slice(0, 150)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
        aria-label="Søk (Ctrl+K)"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Søk...</span>
        <kbd className="ml-2 hidden rounded border border-border bg-background px-1.5 py-0.5 text-xs sm:inline">
          ⌘K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="top-[20%] translate-y-0 gap-0 p-0 sm:max-w-lg">
          <DialogTitle className="sr-only">Søk i wiki</DialogTitle>
          <div className="flex items-center border-b border-border px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Søk i teori, regler, eksempler, oppgaver..."
              className="border-0 bg-transparent shadow-none focus-visible:ring-0"
              autoFocus
            />
          </div>

          <div className="max-h-80 overflow-y-auto p-2" role="listbox">
            {loading && (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                Søker...
              </p>
            )}

            {!loading && query.length >= 2 && results.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                Ingen treff for «{query}»
              </p>
            )}

            {!loading &&
              Object.entries(grouped).map(([type, items]) => {
                const meta = TYPE_LABELS[type] ?? {
                  label: type,
                  icon: FileText,
                }
                const Icon = meta.icon
                return (
                  <div key={type} className="mb-2">
                    <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-muted-foreground">
                      <Icon className="h-3 w-3" />
                      {meta.label}
                    </div>
                    {items.map((result) => {
                      const globalIdx = results.indexOf(result)
                      return (
                        <button
                          key={result.id}
                          role="option"
                          aria-selected={globalIdx === selectedIndex}
                          className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                            globalIdx === selectedIndex
                              ? 'bg-accent text-accent-foreground'
                              : 'hover:bg-muted'
                          }`}
                          onClick={() => navigateToResult(result)}
                          onMouseEnter={() => setSelectedIndex(globalIdx)}
                        >
                          <div className="font-medium">
                            {result.chapter} — {result.topic}
                          </div>
                          <div className="line-clamp-1 text-xs text-muted-foreground">
                            {stripContent(result.content)}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )
              })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
