import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDownAZ, ArrowUpAZ, Download, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FilterTabs } from '@/components/filters/FilterTabs'
import { QueryBuilder } from '@/components/filters/QueryBuilder'
import { AppShell } from '@/components/layout/AppShell'
import { IssueModal } from '@/components/issues/IssueModal'
import { IssueKanban } from '@/components/issues/IssueKanban'
import { SprintSections } from '@/components/spaces/SprintSections'
import {
  CommandPalette,
  useCommandPalette,
} from '@/components/ui/command-palette'
import { Button } from '@/components/ui/button'
import { chipsToQuery, useIssueFilters } from '@/hooks/useIssueFilters'
import { useKeyboardTriage } from '@/hooks/useKeyboardTriage'
import { useRealtime } from '@/hooks/useRealtime'
import { api } from '@/lib/api'

export function DashboardPage() {
  const { projectKey: routeProjectKey } = useParams<{ projectKey: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [triageMode, setTriageMode] = useState(false)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [drawerKey, setDrawerKey] = useState<string | null>(null)
  const [sprintSortDir, setSprintSortDir] = useState<'asc' | 'desc'>('desc')
  const [activeFilterId, setActiveFilterId] = useState<string>()
  const [flashingKeys, setFlashingKeys] = useState<Set<string>>(new Set())
  const [paletteSearch, setPaletteSearch] = useState('')

  const { open: paletteOpen, setOpen: setPaletteOpen } = useCommandPalette()

  const { data: spaces = [], isLoading: spacesLoading } = useQuery({
    queryKey: ['spaces'],
    queryFn: () => api.spaces.list(),
  })

  const { data: savedFilters = [] } = useQuery({
    queryKey: ['filters'],
    queryFn: () => api.filters.list(),
  })

  const {
    chips,
    issueQuery,
    projectKey,
    setProjectKey,
    addChip,
    removeChip,
    loadFromQuery,
  } = useIssueFilters({ initialProjectKey: routeProjectKey })

  useEffect(() => {
    if (routeProjectKey) {
      setProjectKey(routeProjectKey)
    }
  }, [routeProjectKey, setProjectKey])

  useEffect(() => {
    if (!routeProjectKey && spaces.length > 0) {
      navigate(`/espaco/${spaces[0].projectKey}`, { replace: true })
    }
  }, [routeProjectKey, spaces, navigate])

  const selectedSpace = useMemo(
    () => spaces.find((s) => s.projectKey === projectKey),
    [spaces, projectKey],
  )

  const sprintOrder = useMemo(
    () => selectedSpace?.sprints.map((s) => s.name) ?? [],
    [selectedSpace],
  )

  const { data: issues = [], isLoading: issuesLoading, isFetching } = useQuery({
    queryKey: ['issues', issueQuery],
    queryFn: () => api.issues.list(issueQuery),
    enabled: !!projectKey || spaces.length === 0,
    placeholderData: (previous) => previous,
  })

  const { data: paletteIssues = [] } = useQuery({
    queryKey: ['issues', 'palette', paletteSearch, projectKey],
    queryFn: () =>
      api.issues.list({
        projectKey,
        sustentacao: true,
        q: paletteSearch || undefined,
      }),
    enabled: paletteOpen && !!projectKey,
  })

  const flashIssue = useCallback((key: string) => {
    setFlashingKeys((prev) => new Set(prev).add(key))
    setTimeout(() => {
      setFlashingKeys((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }, 2000)
  }, [])

  const { connected } = useRealtime({ onIssueUpdated: flashIssue })

  const importAllMutation = useMutation({
    mutationFn: () => api.boards.importAll(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['spaces'] })
      void queryClient.invalidateQueries({ queryKey: ['boards'] })
      void queryClient.invalidateQueries({ queryKey: ['issues'] })
      void queryClient.invalidateQueries({ queryKey: ['metrics'] })
    },
  })

  const syncMutation = useMutation({
    mutationFn: async () => {
      if (selectedSpace && selectedSpace.boardIds.length > 0) {
        await Promise.all(
          selectedSpace.boardIds.map((id) => api.boards.sync(id)),
        )
      } else {
        await api.boards.syncAll()
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['issues'] })
      void queryClient.invalidateQueries({ queryKey: ['spaces'] })
      void queryClient.invalidateQueries({ queryKey: ['boards'] })
      void queryClient.invalidateQueries({ queryKey: ['metrics'] })
    },
  })

  const saveFilterMutation = useMutation({
    mutationFn: (name: string) =>
      api.filters.create({
        name,
        query: { ...chipsToQuery(chips), projectKey, sustentacao: true },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['filters'] })
    },
  })

  const saveNoteMutation = useMutation({
    mutationFn: ({
      jiraKey,
      content,
      poStatus,
    }: {
      jiraKey: string
      content: string
      poStatus?: string | null
    }) => api.notes.upsert(jiraKey, { content, poStatus }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['issues'] })
      void queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })

  const issueKeys = useMemo(() => issues.map((i) => i.jiraKey), [issues])

  useKeyboardTriage({
    enabled: triageMode,
    issueKeys,
    selectedKey,
    onSelect: setSelectedKey,
    onOpen: setDrawerKey,
    onClose: () => setDrawerKey(null),
  })

  const handleFilterSelect = (filter: (typeof savedFilters)[0] | null) => {
    if (!filter) {
      setActiveFilterId(undefined)
      loadFromQuery({ projectKey, sustentacao: true })
      return
    }
    setActiveFilterId(filter.id)
    loadFromQuery(filter.query)
  }

  const handleRowSelect = (key: string) => {
    setSelectedKey(key)
    if (!triageMode) setDrawerKey(key)
  }

  const handleRowOpen = (key: string) => {
    setDrawerKey(key)
  }

  const isLoading = spacesLoading || (spaces.length > 0 && issuesLoading)

  const emptySpacesView = (
    <div className="flex h-[calc(100vh-12rem)] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]/40 p-8 text-center">
      <div className="rounded-2xl bg-[var(--accent-soft)] p-4">
        <Download className="h-8 w-8 text-[var(--primary)]" />
      </div>
      <div className="max-w-md space-y-2">
        <h2 className="text-lg font-semibold text-[var(--text)]">
          Nenhum espaço importado
        </h2>
        <p className="text-sm text-[var(--text-muted)]">
          Importe os boards do Jira para agrupar Bugs e Melhorias por espaço e
          sprint.
        </p>
      </div>
      <Button
        onClick={() => importAllMutation.mutate()}
        disabled={importAllMutation.isPending}
        size="lg"
      >
        <RefreshCw
          className={importAllMutation.isPending ? 'animate-spin' : undefined}
        />
        Importar boards do Jira
      </Button>
    </div>
  )

  return (
    <>
      <AppShell
        spaces={spaces}
        selectedProjectKey={projectKey}
        onSpaceChange={(key) => navigate(`/espaco/${key}`)}
        filters={savedFilters}
        activeFilterId={activeFilterId}
        onFilterSelect={handleFilterSelect}
        connected={connected}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        triageMode={triageMode}
        onTriageModeChange={setTriageMode}
        onSync={() => syncMutation.mutate()}
        syncing={syncMutation.isPending}
        onOpenSearch={() => setPaletteOpen(true)}
        filterBar={
          spaces.length > 0 ? (
            <>
              <FilterTabs
                filters={savedFilters}
                activeId={activeFilterId}
                onSelect={handleFilterSelect}
              />
              <div className="px-4 py-2">
                <QueryBuilder
                  chips={chips}
                  onAddChip={addChip}
                  onRemoveChip={removeChip}
                  onSaveFilter={(name) => saveFilterMutation.mutate(name)}
                />
              </div>
            </>
          ) : undefined
        }
      >
        {spaces.length === 0 && !spacesLoading ? (
          emptySpacesView
        ) : isLoading && issues.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-[var(--text-muted)]">
            Carregando issues…
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-end gap-2">
              {isFetching && (
                <span className="text-[10px] text-[var(--text-muted)]">
                  atualizando…
                </span>
              )}
              <span className="text-xs text-[var(--text-muted)]">Ordenar sprints</span>
              <div className="flex rounded-xl border border-[var(--border)] p-0.5">
                <Button
                  variant={sprintSortDir === 'asc' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSprintSortDir('asc')}
                  className="h-7 gap-1 px-2.5"
                >
                  <ArrowUpAZ className="h-3.5 w-3.5" />
                  Sprint ↑
                </Button>
                <Button
                  variant={sprintSortDir === 'desc' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSprintSortDir('desc')}
                  className="h-7 gap-1 px-2.5"
                >
                  <ArrowDownAZ className="h-3.5 w-3.5" />
                  Sprint ↓
                </Button>
              </div>
            </div>
            <SprintSections
              issues={issues}
              sprintOrder={sprintOrder}
              sortDir={sprintSortDir}
              selectedKey={selectedKey}
              flashingKeys={flashingKeys}
              triageMode={triageMode}
              onSelect={handleRowSelect}
              onOpen={handleRowOpen}
              onSaveNote={(jiraKey, payload) =>
                saveNoteMutation.mutate({ jiraKey, ...payload })
              }
            />
          </div>
        ) : (
          <IssueKanban
            issues={issues}
            selectedKey={selectedKey}
            onSelect={setSelectedKey}
            onOpen={setDrawerKey}
          />
        )}
      </AppShell>

      <IssueModal issueKey={drawerKey} onClose={() => setDrawerKey(null)} />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        issues={paletteIssues}
        onSelect={(key) => {
          setSelectedKey(key)
          setDrawerKey(key)
        }}
        onSearch={setPaletteSearch}
      />
    </>
  )
}
