import { ChevronLeft, ChevronRight, Filter, LayoutGrid } from 'lucide-react'
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import logoUrl from '@/assets/logo.svg'
import { SpaceAvatar } from '@/components/spaces/SpaceAvatar'
import type { SavedFilter, Space } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Button } from '../ui/button'

interface SidebarProps {
  spaces: Space[]
  selectedProjectKey?: string
  onSpaceChange: (projectKey: string) => void
  filters: SavedFilter[]
  activeFilterId?: string
  onFilterSelect: (filter: SavedFilter) => void
}

export function Sidebar({
  spaces,
  selectedProjectKey,
  onSpaceChange,
  filters,
  activeFilterId,
  onFilterSelect,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-xl transition-all duration-300',
        collapsed ? 'w-[68px]' : 'w-64',
      )}
    >
      <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-5">
        <img src={logoUrl} alt="Avantpro" className="h-8 w-8 shrink-0" />
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight text-[var(--text)]">
              Avantpro PO
            </p>
            <p className="truncate text-[10px] text-[var(--text-muted)]">
              Sustentação & triagem
            </p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn('shrink-0', collapsed ? 'mx-auto' : 'ml-auto')}
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        <section>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                'mb-3 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-[var(--primary)]/15 text-[var(--primary)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]',
              )
            }
            title="Dashboard geral"
          >
            <LayoutGrid className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Dashboard geral</span>}
          </NavLink>

          {!collapsed && (
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Espaços
            </p>
          )}
          <div className="space-y-1">
            {spaces.map((space) => (
              <button
                key={space.projectKey}
                type="button"
                onClick={() => {
                  onSpaceChange(space.projectKey)
                  navigate(`/espaco/${space.projectKey}`)
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors',
                  selectedProjectKey === space.projectKey
                    ? 'bg-[var(--primary)]/15 text-[var(--primary)]'
                    : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]',
                )}
                title={space.name}
              >
                <SpaceAvatar
                  name={space.name}
                  avatarUrl={space.avatarUrl}
                  size="sm"
                />
                {!collapsed && (
                  <span className="min-w-0 flex-1 truncate text-left">
                    {space.name}
                  </span>
                )}
                {!collapsed && space.issueCount > 0 && (
                  <span className="shrink-0 rounded-full bg-[var(--accent-soft)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--primary)]">
                    {space.issueCount}
                  </span>
                )}
              </button>
            ))}
            {spaces.length === 0 && !collapsed && (
              <p className="px-2 text-xs text-[var(--text-muted)]">
                Nenhum espaço importado
              </p>
            )}
          </div>
        </section>

        <section>
          {!collapsed && (
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Filtros salvos
            </p>
          )}
          <div className="space-y-1">
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => onFilterSelect(filter)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors',
                  activeFilterId === filter.id
                    ? 'bg-[var(--accent-soft)] text-[var(--primary)]'
                    : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]',
                )}
                title={filter.name}
              >
                <Filter className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <span className="truncate text-left">{filter.name}</span>
                )}
              </button>
            ))}
            {filters.length === 0 && !collapsed && (
              <p className="px-2 text-xs text-[var(--text-muted)]">
                Salve filtros no query builder
              </p>
            )}
          </div>
        </section>
      </div>
    </aside>
  )
}
