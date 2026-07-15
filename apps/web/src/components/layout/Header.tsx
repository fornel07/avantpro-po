import {
  Columns3,
  List,
  Moon,
  RefreshCw,
  Search,
  Sun,
  Zap,
} from 'lucide-react'
import { SpaceAvatar } from '@/components/spaces/SpaceAvatar'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'

export type ViewMode = 'list' | 'kanban'

interface HeaderSpace {
  name: string
  avatarUrl: string | null
  projectKey: string
}

interface HeaderProps {
  space?: HeaderSpace
  title?: string
  subtitle?: string
  onOpenSearch?: () => void
  connected: boolean
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  triageMode: boolean
  onTriageModeChange: (enabled: boolean) => void
  onSync: () => void
  syncing: boolean
  hideViewToggles?: boolean
}

export function Header({
  space,
  title,
  subtitle,
  onOpenSearch,
  connected,
  viewMode,
  onViewModeChange,
  triageMode,
  onTriageModeChange,
  onSync,
  syncing,
  hideViewToggles = false,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme()
  const scopeLabel =
    space?.projectKey?.toUpperCase() === 'IDEIA'
      ? 'Todos os tipos'
      : 'Bug & Melhoria'

  return (
    <header className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--surface)]/60 px-4 py-3 backdrop-blur-xl">
      {space ? (
        <div className="flex min-w-0 items-center gap-2.5 border-r border-[var(--border)] pr-3">
          <SpaceAvatar
            name={space.name}
            avatarUrl={space.avatarUrl}
            size="md"
          />
          <div className="min-w-0 hidden sm:block">
            <p className="truncate text-sm font-semibold text-[var(--text)]">
              {space.name}
            </p>
            <p className="truncate text-[10px] text-[var(--text-muted)]">
              {space.projectKey} · {scopeLabel}
            </p>
          </div>
        </div>
      ) : title ? (
        <div className="min-w-0 border-r border-[var(--border)] pr-3">
          <p className="truncate text-sm font-semibold text-[var(--text)]">
            {title}
          </p>
          {subtitle && (
            <p className="truncate text-[10px] text-[var(--text-muted)]">
              {subtitle}
            </p>
          )}
        </div>
      ) : null}

      {onOpenSearch && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenSearch}
          className="min-w-[200px] justify-start text-[var(--text-muted)]"
        >
          <Search className="h-4 w-4" />
          <span>Buscar issues…</span>
          <kbd className="ml-auto hidden rounded border border-[var(--border)] bg-[var(--bg)] px-1.5 py-0.5 text-[10px] sm:inline">
            ⌘K
          </kbd>
        </Button>
      )}

      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <span
          className={cn(
            'relative flex h-2 w-2 rounded-full',
            connected ? 'bg-emerald-400' : 'bg-red-400',
          )}
        >
          {connected && (
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/60" />
          )}
        </span>
        <span className="hidden sm:inline">
          {connected ? 'Ao vivo' : 'Offline'}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {!hideViewToggles && (
          <>
            <div className="flex rounded-xl border border-[var(--border)] p-0.5">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('list')}
                className="h-7 px-2.5"
              >
                <List className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Lista</span>
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('kanban')}
                className="h-7 px-2.5"
              >
                <Columns3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Kanban</span>
              </Button>
            </div>

            <Button
              variant={triageMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => onTriageModeChange(!triageMode)}
              className={cn(triageMode && 'ring-2 ring-[var(--primary)]/40')}
            >
              <Zap className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Triage</span>
            </Button>
          </>
        )}

        <Button
          variant="secondary"
          size="icon"
          onClick={toggleTheme}
          aria-label="Alternar tema"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={onSync}
          disabled={syncing}
        >
          <RefreshCw
            className={cn('h-3.5 w-3.5', syncing && 'animate-spin')}
          />
          <span className="hidden sm:inline">Sync</span>
        </Button>
      </div>
    </header>
  )
}
