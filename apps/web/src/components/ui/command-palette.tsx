import { Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { Issue } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Input } from './input'

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  issues: Issue[]
  onSelect: (key: string) => void
  onSearch: (q: string) => void
}

export function CommandPalette({
  open,
  onClose,
  issues,
  onSelect,
  onSearch,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)

  useEffect(() => {
    if (open) {
      setQuery('')
      setHighlight(0)
    }
  }, [open])

  useEffect(() => {
    const t = setTimeout(() => onSearch(query), 200)
    return () => clearTimeout(t)
  }, [query, onSearch])

  const results = useMemo(() => {
    if (!query.trim()) return issues.slice(0, 12)
    const q = query.toLowerCase()
    return issues
      .filter(
        (i) =>
          i.jiraKey.toLowerCase().includes(q) ||
          i.summary.toLowerCase().includes(q),
      )
      .slice(0, 12)
  }, [issues, query])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlight((h) => Math.min(h + 1, results.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlight((h) => Math.max(h - 1, 0))
      }
      if (e.key === 'Enter' && results[highlight]) {
        e.preventDefault()
        onSelect(results[highlight].jiraKey)
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, results, highlight, onSelect, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4">
          <Search className="h-4 w-4 text-[var(--text-muted)]" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setHighlight(0)
            }}
            placeholder="Buscar issues por chave ou resumo…"
            className="border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
          <kbd className="hidden rounded-md border border-[var(--border)] bg-[var(--bg)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)] sm:inline">
            ESC
          </kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto py-2">
          {results.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">
              Nenhum resultado
            </li>
          ) : (
            results.map((issue, idx) => (
              <li key={issue.jiraKey}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors',
                    idx === highlight
                      ? 'bg-[var(--primary)]/10 text-[var(--text)]'
                      : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)]',
                  )}
                  onClick={() => {
                    onSelect(issue.jiraKey)
                    onClose()
                  }}
                  onMouseEnter={() => setHighlight(idx)}
                >
                  <span className="font-mono text-xs text-[var(--primary)]">
                    {issue.jiraKey}
                  </span>
                  <span className="truncate">{issue.summary}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return { open, setOpen }
}
