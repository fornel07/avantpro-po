import { StickyNote, X } from 'lucide-react'
import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { Button } from '../ui/button'

export interface PoNoteSavePayload {
  content: string
  poStatus: string | null
}

interface PoNoteStickProps {
  content?: string | null
  color?: string
  onSave: (payload: PoNoteSavePayload) => void
  /** Preserve poStatus when saving note-only edits */
  poStatus?: string | null
  className?: string
  compact?: boolean
}

export function PoNoteStick({
  content,
  color = '#FDE68A',
  onSave,
  poStatus = null,
  className,
  compact = false,
}: PoNoteStickProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(content ?? '')
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(
    null,
  )

  useEffect(() => {
    if (!open) return
    setDraft(content ?? '')
  }, [open, content])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: Event) => {
      const target = e.target as Node
      if (
        !panelRef.current?.contains(target) &&
        !buttonRef.current?.contains(target)
      ) {
        setOpen(false)
      }
    }
    const onScroll = () => setOpen(false)
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [open])

  const hasNote = Boolean(content?.trim())

  const handleOpen = (e: MouseEvent) => {
    e.stopPropagation()
    const rect = buttonRef.current?.getBoundingClientRect()
    if (rect) {
      const panelWidth = 288
      const left = Math.min(rect.left, window.innerWidth - panelWidth - 12)
      setAnchor({ top: rect.bottom + 6, left: Math.max(12, left) })
    }
    setOpen((v) => !v)
  }

  const handleSave = () => {
    onSave({ content: draft.trim(), poStatus })
    setOpen(false)
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpen}
        title={hasNote ? 'Ver nota PO' : 'Adicionar nota PO'}
        className={cn(
          'inline-flex items-center justify-center rounded-lg transition-transform hover:scale-105',
          compact ? 'h-7 w-7' : 'h-9 w-9',
          hasNote
            ? 'shadow-sm ring-1 ring-black/10'
            : 'border border-dashed border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-amber-400/50',
          className,
        )}
        style={
          hasNote
            ? { backgroundColor: color, color: '#78350f' }
            : undefined
        }
      >
        <StickyNote className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      </button>

      {open &&
        anchor &&
        createPortal(
          <div
            ref={panelRef}
            className="fixed z-[200] w-72 rounded-xl border border-amber-300/50 p-3 shadow-2xl"
            style={{
              top: anchor.top,
              left: anchor.left,
              backgroundColor: color,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-900/80">
                Nota PO
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-0.5 text-amber-900/60 hover:bg-black/5"
                aria-label="Fechar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={4}
              placeholder="Anota pendências, contexto, decisão…"
              className="w-full resize-y rounded-lg border border-amber-900/15 bg-white/60 px-2 py-1.5 text-sm text-amber-950 outline-none placeholder:text-amber-900/40 focus:ring-2 focus:ring-amber-600/20"
              autoFocus
            />
            <div className="mt-2 flex justify-end gap-2">
              {hasNote && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-amber-900"
                  onClick={() => {
                    setDraft('')
                    onSave({ content: '', poStatus })
                    setOpen(false)
                  }}
                >
                  Limpar
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                className="bg-amber-900 text-amber-50 hover:bg-amber-950"
              >
                Salvar
              </Button>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
