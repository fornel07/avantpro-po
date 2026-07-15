import type { Issue } from '@/lib/api'
import { cn, getKanbanColumn, type KanbanColumn } from '@/lib/utils'
import { Badge, priorityVariant } from '../ui/badge'

const COLUMNS: { id: KanbanColumn; label: string }[] = [
  { id: 'triagem', label: 'Triagem' },
  { id: 'desenvolvimento', label: 'Em Desenvolvimento' },
  { id: 'validacao', label: 'Validação' },
]

interface IssueKanbanProps {
  issues: Issue[]
  selectedKey: string | null
  onSelect: (key: string) => void
  onOpen: (key: string) => void
}

export function IssueKanban({
  issues,
  selectedKey,
  onSelect,
  onOpen,
}: IssueKanbanProps) {
  const grouped = COLUMNS.map((col) => ({
    ...col,
    items: issues.filter((i) => getKanbanColumn(i) === col.id),
  }))

  return (
    <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-3">
      {grouped.map((col) => (
        <div
          key={col.id}
          className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <h3 className="text-sm font-semibold text-[var(--text)]">
              {col.label}
            </h3>
            <span className="rounded-lg bg-[var(--bg)] px-2 py-0.5 text-xs text-[var(--text-muted)]">
              {col.items.length}
            </span>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {col.items.map((issue) => (
              <button
                key={issue.jiraKey}
                type="button"
                onClick={() => {
                  onSelect(issue.jiraKey)
                  onOpen(issue.jiraKey)
                }}
                className={cn(
                  'w-full rounded-xl border border-[var(--border)] bg-[var(--bg)]/40 p-3 text-left transition-all hover:border-[var(--primary)]/40 hover:bg-[var(--row-hover)]',
                  selectedKey === issue.jiraKey &&
                    'border-[var(--primary)]/50 ring-1 ring-[var(--primary)]/30',
                )}
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-[var(--primary)]">
                    {issue.jiraKey}
                  </span>
                  <Badge variant={priorityVariant(issue.priority)} className="text-[10px]">
                    {issue.priority ?? '—'}
                  </Badge>
                </div>
                <p className="line-clamp-2 text-sm text-[var(--text)]">
                  {issue.summary}
                </p>
                <p className="mt-2 text-[10px] text-[var(--text-muted)]">
                  {issue.assignee ?? 'Sem assignee'} · {issue.status}
                </p>
              </button>
            ))}
            {col.items.length === 0 && (
              <p className="py-8 text-center text-xs text-[var(--text-muted)]">
                Vazio
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
