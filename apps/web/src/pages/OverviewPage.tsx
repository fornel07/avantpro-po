import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowDownAZ,
  ArrowRight,
  ArrowUpAZ,
  Bug,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Lightbulb,
  RefreshCw,
} from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FilterTabs } from '@/components/filters/FilterTabs'
import { QueryBuilder } from '@/components/filters/QueryBuilder'
import { IssueModal } from '@/components/issues/IssueModal'
import { AppShell } from '@/components/layout/AppShell'
import { SpaceAvatar } from '@/components/spaces/SpaceAvatar'
import { SprintSections } from '@/components/spaces/SprintSections'
import { Button } from '@/components/ui/button'
import { Badge, typeVariant } from '@/components/ui/badge'
import { chipsToQuery, useIssueFilters } from '@/hooks/useIssueFilters'
import { useRealtime } from '@/hooks/useRealtime'
import { api, type Issue, type Space } from '@/lib/api'
import { cn } from '@/lib/utils'

export function OverviewPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [sprintSortDir, setSprintSortDir] = useState<'asc' | 'desc'>('desc')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [modalKey, setModalKey] = useState<string | null>(null)
  const [flashingKeys, setFlashingKeys] = useState<Set<string>>(new Set())
  const [activeFilterId, setActiveFilterId] = useState<string>()
  const [spacesExpanded, setSpacesExpanded] = useState(false)

  const {
    chips,
    search,
    issueQuery,
    setSearch,
    addChip,
    removeChip,
    loadFromQuery,
  } = useIssueFilters({ overview: true })

  const { connected } = useRealtime({
    onIssueUpdated: (key) => {
      setFlashingKeys((prev) => new Set(prev).add(key))
      setTimeout(() => {
        setFlashingKeys((prev) => {
          const next = new Set(prev)
          next.delete(key)
          return next
        })
      }, 2000)
    },
  })

  const { data: spaces = [], isLoading: spacesLoading } = useQuery({
    queryKey: ['spaces'],
    queryFn: () => api.spaces.list(),
  })

  const { data: savedFilters = [] } = useQuery({
    queryKey: ['filters'],
    queryFn: () => api.filters.list(),
  })

  const { data: issues = [], isLoading: issuesLoading, isFetching } = useQuery({
    queryKey: ['issues', 'overview', issueQuery],
    queryFn: () => api.issues.list(issueQuery),
    placeholderData: (previous) => previous,
  })

  const syncMutation = useMutation({
    mutationFn: () => api.boards.syncAll(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['spaces'] })
      void queryClient.invalidateQueries({ queryKey: ['issues'] })
      void queryClient.invalidateQueries({ queryKey: ['metrics'] })
    },
  })

  const importMutation = useMutation({
    mutationFn: () => api.boards.importAll(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['spaces'] })
      void queryClient.invalidateQueries({ queryKey: ['issues'] })
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
    },
  })

  const saveFilterMutation = useMutation({
    mutationFn: (name: string) =>
      api.filters.create({
        name,
        query: { ...chipsToQuery(chips), ...issueQuery, overview: true },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['filters'] })
    },
  })

  const spaceKeys = useMemo(
    () => spaces.map((s) => s.projectKey).sort((a, b) => a.localeCompare(b)),
    [spaces],
  )

  const spaceNameByKey = useMemo(() => {
    const map = new Map<string, string>()
    for (const space of spaces) map.set(space.projectKey, space.name)
    return map
  }, [spaces])

  const stats = useMemo(() => {
    const bugs = issues.filter(
      (i) => i.issueType?.toLowerCase() === 'bug',
    ).length
    const melhorias = issues.filter((i) => {
      const t = i.issueType?.toLowerCase() ?? ''
      return t === 'melhoria' || t === 'improvement'
    }).length
    return { bugs, melhorias, total: issues.length, spaces: spaces.length }
  }, [issues, spaces.length])

  const issuesBySpace = useMemo(() => {
    const map = new Map<string, { space: Space; issues: Issue[] }>()
    for (const space of spaces) {
      map.set(space.projectKey, { space, issues: [] })
    }
    for (const issue of issues) {
      const key = issue.board?.projectKey
      if (!key) continue
      const bucket = map.get(key)
      if (bucket) bucket.issues.push(issue)
      else {
        map.set(key, {
          space: {
            projectKey: key,
            name: issue.board?.projectName ?? key,
            avatarUrl: issue.board?.avatarUrl ?? null,
            boardIds: issue.boardId ? [issue.boardId] : [],
            issueCount: 1,
            sprints: [],
          },
          issues: [issue],
        })
      }
    }
    return [...map.values()]
      .filter((entry) => entry.issues.length > 0)
      .sort((a, b) => a.space.name.localeCompare(b.space.name, 'pt-BR'))
  }, [issues, spaces])

  return (
    <>
      <AppShell
        spaces={spaces}
        selectedProjectKey={undefined}
        onSpaceChange={(key) => navigate(`/espaco/${key}`)}
        filters={savedFilters}
        activeFilterId={activeFilterId}
        onFilterSelect={(filter) => {
          setActiveFilterId(filter.id)
          loadFromQuery(filter.query)
        }}
        connected={connected}
        viewMode="list"
        onViewModeChange={() => undefined}
        triageMode={false}
        onTriageModeChange={() => undefined}
        onSync={() => syncMutation.mutate()}
        syncing={syncMutation.isPending}
        hideViewToggles
        headerTitle="Dashboard geral"
        headerSubtitle="Todos os espaços · Bug & Melhoria"
        filterBar={
          spaces.length > 0 ? (
            <>
              <FilterTabs
                filters={savedFilters}
                activeId={activeFilterId}
                onSelect={(filter) => {
                  if (!filter) {
                    setActiveFilterId(undefined)
                    loadFromQuery({ sustentacao: true })
                    return
                  }
                  setActiveFilterId(filter.id)
                  loadFromQuery(filter.query)
                }}
              />
              <div className="px-4 py-2">
                <QueryBuilder
                  chips={chips}
                  onAddChip={addChip}
                  onRemoveChip={removeChip}
                  onSaveFilter={(name) => saveFilterMutation.mutate(name)}
                  fields={[
                    'type',
                    'priority',
                    'status',
                    'sprint',
                    'assignee',
                    'projectKey',
                  ]}
                  suggestions={{
                    type: ['Bug', 'Melhoria'],
                    projectKey: spaceKeys,
                    priority: ['Highest', 'High', 'Medium', 'Low', 'Lowest'],
                  }}
                  search={search}
                  onSearchChange={setSearch}
                  quickFilters={[
                    { label: 'Bugs', field: 'type', value: 'Bug' },
                    { label: 'Melhorias', field: 'type', value: 'Melhoria' },
                  ]}
                />
                {issueQuery.projectKey && (
                  <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">
                    Filtrando espaço{' '}
                    <span className="font-medium text-[var(--text)]">
                      {spaceNameByKey.get(issueQuery.projectKey) ??
                        issueQuery.projectKey}
                    </span>
                  </p>
                )}
              </div>
            </>
          ) : undefined
        }
      >
        <div className="space-y-8">
          <header className="space-y-2">
            <div className="flex items-center gap-2 text-[var(--primary)]">
              <LayoutGrid className="h-5 w-5" />
              <p className="text-xs font-semibold uppercase tracking-wider">
                Dashboard geral
              </p>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">
              Todos os espaços · Bug & Melhoria
            </h1>
            <p className="max-w-2xl text-sm text-[var(--text-muted)]">
              Visão unificada da sustentação. Abra um espaço para triagem
              detalhada. Banco de ideias sincroniza todos os tipos de card.
            </p>
          </header>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Espaços" value={stats.spaces} />
            <StatCard
              label="Bugs"
              value={stats.bugs}
              icon={<Bug className="h-4 w-4 text-[var(--primary)]" />}
            />
            <StatCard
              label="Melhorias"
              value={stats.melhorias}
              icon={<Lightbulb className="h-4 w-4 text-[var(--accent-cyan)]" />}
            />
            <StatCard label="Cards ativos" value={stats.total} />
          </div>

          {spacesLoading ? (
            <p className="text-sm text-[var(--text-muted)]">Carregando espaços…</p>
          ) : spaces.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--border)] py-16">
              <p className="text-sm text-[var(--text-muted)]">
                Nenhum espaço importado ainda.
              </p>
              <Button
                onClick={() => importMutation.mutate()}
                disabled={importMutation.isPending}
              >
                <RefreshCw
                  className={importMutation.isPending ? 'animate-spin' : undefined}
                />
                Importar boards do Jira
              </Button>
            </div>
          ) : (
            <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/40">
              <button
                type="button"
                onClick={() => setSpacesExpanded((v) => !v)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-[var(--surface-hover)]"
                aria-expanded={spacesExpanded}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <h2 className="text-sm font-semibold text-[var(--text)]">
                    Espaços / boards
                  </h2>
                  <span className="rounded-md bg-[var(--accent-soft)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--primary)]">
                    {spaces.length}
                  </span>
                  {!spacesExpanded && (
                    <span className="truncate text-[11px] text-[var(--text-muted)]">
                      {spaces
                        .slice(0, 4)
                        .map((s) => s.projectKey)
                        .join(' · ')}
                      {spaces.length > 4 ? '…' : ''}
                    </span>
                  )}
                </div>
                {spacesExpanded ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                )}
              </button>
              {spacesExpanded && (
                <div className="grid gap-3 border-t border-[var(--border)] p-3 sm:grid-cols-2 xl:grid-cols-3">
                  {spaces.map((space) => (
                    <Link
                      key={space.projectKey}
                      to={`/espaco/${space.projectKey}`}
                      className={cn(
                        'group rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 p-4 transition-all',
                        'hover:border-[var(--primary)]/40 hover:bg-[var(--surface-hover)]',
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <SpaceAvatar
                          name={space.name}
                          avatarUrl={space.avatarUrl}
                          size="md"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate font-medium text-[var(--text)]">
                              {space.name}
                            </h3>
                            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
                          </div>
                          <p className="mt-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                            {space.projectKey}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge variant="primary">
                              {space.issueCount} cards
                            </Badge>
                            <Badge
                              variant={
                                space.syncMode === 'all' ? 'accent' : 'default'
                              }
                            >
                              {space.syncMode === 'all'
                                ? 'Todos os tipos'
                                : 'Bug & Melhoria'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-[var(--text)]">
                Cards Bug & Melhoria por espaço
                {isFetching && !issuesLoading && (
                  <span className="ml-2 text-[10px] font-normal text-[var(--text-muted)]">
                    atualizando…
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-muted)]">
                  Ordenar sprints
                </span>
                <div className="flex rounded-xl border border-[var(--border)] p-0.5">
                  <Button
                    variant={sprintSortDir === 'asc' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSprintSortDir('asc')}
                    className="h-7 gap-1 px-2.5"
                  >
                    <ArrowUpAZ className="h-3.5 w-3.5" />
                    ↑
                  </Button>
                  <Button
                    variant={sprintSortDir === 'desc' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSprintSortDir('desc')}
                    className="h-7 gap-1 px-2.5"
                  >
                    <ArrowDownAZ className="h-3.5 w-3.5" />
                    ↓
                  </Button>
                </div>
              </div>
            </div>

            {issuesLoading && issues.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">Carregando cards…</p>
            ) : issuesBySpace.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[var(--border)] py-12 text-center text-sm text-[var(--text-muted)]">
                Nenhum Bug ou Melhoria ativo no momento.
              </p>
            ) : (
              <div className="space-y-10">
                {issuesBySpace.map(({ space, issues: spaceIssues }) => (
                  <div key={space.projectKey} className="space-y-3">
                    <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <SpaceAvatar
                          name={space.name}
                          avatarUrl={space.avatarUrl}
                          size="sm"
                        />
                        <div>
                          <Link
                            to={`/espaco/${space.projectKey}`}
                            className="font-medium text-[var(--text)] hover:text-[var(--primary)]"
                          >
                            {space.name}
                          </Link>
                          <p className="text-[10px] text-[var(--text-muted)]">
                            {spaceIssues.length} Bug/Melhoria ·{' '}
                            {spaceIssues.filter((i) => i.issueType?.toLowerCase() === 'bug').length}{' '}
                            bugs ·{' '}
                            {
                              spaceIssues.filter((i) =>
                                ['melhoria', 'improvement'].includes(
                                  i.issueType?.toLowerCase() ?? '',
                                ),
                              ).length
                            }{' '}
                            melhorias
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {Array.from(
                          new Set(spaceIssues.map((i) => i.issueType).filter(Boolean)),
                        ).map((type) => (
                          <Badge key={type} variant={typeVariant(type)}>
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <SprintSections
                      issues={spaceIssues}
                      sortDir={sprintSortDir}
                      selectedKey={selectedKey}
                      flashingKeys={flashingKeys}
                      triageMode={false}
                      onSelect={setSelectedKey}
                      onOpen={setModalKey}
                      onSaveNote={(jiraKey, payload) =>
                        saveNoteMutation.mutate({ jiraKey, ...payload })
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </AppShell>

      <IssueModal issueKey={modalKey} onClose={() => setModalKey(null)} />
    </>
  )
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string
  value: number
  icon?: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 px-4 py-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          {label}
        </p>
        {icon}
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--text)]">
        {value}
      </p>
    </div>
  )
}
