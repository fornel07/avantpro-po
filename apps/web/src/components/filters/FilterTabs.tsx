import type { SavedFilter } from '@/lib/api'
import { cn } from '@/lib/utils'

interface FilterTabsProps {
  filters: SavedFilter[]
  activeId?: string
  onSelect: (filter: SavedFilter | null) => void
}

export function FilterTabs({ filters, activeId, onSelect }: FilterTabsProps) {
  if (filters.length === 0) return null

  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-[var(--border)] bg-[var(--surface)]/40 px-4 py-2 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          'shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
          !activeId
            ? 'bg-[var(--primary)]/15 text-[var(--primary)]'
            : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)]',
        )}
      >
        Todos
      </button>
      {filters.map((filter) => (
        <button
          key={filter.id}
          type="button"
          onClick={() => onSelect(filter)}
          className={cn(
            'shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
            activeId === filter.id
              ? 'bg-[var(--primary)]/15 text-[var(--primary)]'
              : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)]',
          )}
        >
          {filter.name}
        </button>
      ))}
    </div>
  )
}
