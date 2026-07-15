import type { ReactNode } from 'react'
import type { SavedFilter, Space } from '@/lib/api'
import { Header, type ViewMode } from './Header'
import { Sidebar } from './Sidebar'

interface AppShellProps {
  spaces: Space[]
  selectedProjectKey?: string
  onSpaceChange: (projectKey: string) => void
  filters: SavedFilter[]
  activeFilterId?: string
  onFilterSelect: (filter: SavedFilter) => void
  connected: boolean
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  triageMode: boolean
  onTriageModeChange: (enabled: boolean) => void
  onSync: () => void
  syncing: boolean
  onOpenSearch?: () => void
  metrics?: ReactNode
  filterBar?: ReactNode
  children: ReactNode
  hideViewToggles?: boolean
  headerTitle?: string
  headerSubtitle?: string
}

export function AppShell({
  spaces,
  selectedProjectKey,
  onSpaceChange,
  filters,
  activeFilterId,
  onFilterSelect,
  connected,
  viewMode,
  onViewModeChange,
  triageMode,
  onTriageModeChange,
  onSync,
  syncing,
  onOpenSearch,
  metrics,
  filterBar,
  children,
  hideViewToggles = false,
  headerTitle,
  headerSubtitle,
}: AppShellProps) {
  const selectedSpace = spaces.find((s) => s.projectKey === selectedProjectKey)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        spaces={spaces}
        selectedProjectKey={selectedProjectKey}
        onSpaceChange={onSpaceChange}
        filters={filters}
        activeFilterId={activeFilterId}
        onFilterSelect={onFilterSelect}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          space={
            selectedSpace
              ? {
                  name: selectedSpace.name,
                  avatarUrl: selectedSpace.avatarUrl,
                  projectKey: selectedSpace.projectKey,
                }
              : undefined
          }
          title={headerTitle}
          subtitle={headerSubtitle}
          onOpenSearch={onOpenSearch}
          connected={connected}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          triageMode={triageMode}
          onTriageModeChange={onTriageModeChange}
          onSync={onSync}
          syncing={syncing}
          hideViewToggles={hideViewToggles}
        />
        {metrics}
        {filterBar}
        <main className="flex-1 overflow-auto p-4">{children}</main>
      </div>
    </div>
  )
}

export type { ViewMode }
