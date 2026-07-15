const rawBase = import.meta.env.VITE_API_URL ?? ''
export const API_BASE = rawBase
  ? `${rawBase.replace(/\/$/, '')}/api`
  : '/api'

export interface Board {
  id: string
  jiraBoardId: number
  name: string
  projectKey: string
  type: string | null
  avatarUrl?: string | null
  projectName?: string | null
  createdAt: string
  updatedAt: string
}

export interface Space {
  projectKey: string
  name: string
  avatarUrl: string | null
  boardIds: string[]
  issueCount: number
  syncMode?: 'all' | 'sustentacao'
  sprints: Array<{ name: string; issueCount: number }>
}

export interface PoNote {
  id: string
  jiraKey?: string
  content: string
  poStatus?: string | null
  color: string
  updatedAt: string
  createdAt?: string
}

export interface PoNoteUpsert {
  content: string
  poStatus?: string | null
  color?: string
}

export interface Issue {
  id: string
  jiraKey: string
  jiraId: string
  boardId: string | null
  summary: string
  description?: string | null
  issueType: string | null
  status: string | null
  statusCategory: string | null
  priority: string | null
  assignee: string | null
  assigneeAccountId: string | null
  reporter: string | null
  sprint: string | null
  storyPoints: number | null
  originalEstimateSeconds: number | null
  remainingEstimateSeconds: number | null
  timeSpentSeconds: number | null
  labels: string[]
  components: string[]
  fixVersions: string[]
  browseUrl: string | null
  parentKey: string | null
  subtasks?: unknown
  customFields?: unknown
  raw?: unknown
  jiraCreatedAt: string | null
  jiraUpdatedAt: string | null
  createdAt: string
  updatedAt: string
  poNote?: PoNote | null
  board?: {
    id: string
    projectKey: string
    projectName: string | null
    avatarUrl: string | null
    name: string
  } | null
}

export interface FlattenedField {
  key: string
  name: string | null
  value: unknown
}

export interface SavedFilter {
  id: string
  name: string
  query: Record<string, unknown>
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface HealthMetrics {
  status: 'ok'
  issuesTotal: number
  doneIssues: number
  averageLeadTimeDays: number | null
  bugCount: number
  featureCount: number
  bugFeatureRatio: number | null
}

export interface IssueQuery {
  boardId?: string
  projectKey?: string
  sustentacao?: boolean
  type?: string
  types?: string
  priority?: string
  status?: string
  q?: string
  assignee?: string
  sprint?: string
  labels?: string
}

export interface TriagePayload {
  priority?: string
  status?: string
  assignee?: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(text || `Request failed: ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

function toQueryString(query: IssueQuery): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    if (typeof value === 'boolean') {
      if (value) params.set(key, 'true')
    } else {
      params.set(key, String(value))
    }
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export const api = {
  spaces: {
    list: () => request<Space[]>('/spaces'),
  },
  boards: {
    list: () => request<Board[]>('/boards'),
    create: (jiraBoardId: number) =>
      request<Board>('/boards', {
        method: 'POST',
        body: JSON.stringify({ jiraBoardId }),
      }),
    sync: (id: string) =>
      request<{ ok: boolean }>(`/boards/${id}/sync`, { method: 'POST' }),
    importAll: () =>
      request<{ ok: boolean }>('/boards/import-all', { method: 'POST' }),
    syncAll: () =>
      request<{ ok: boolean }>('/boards/sync-all', { method: 'POST' }),
  },
  issues: {
    list: (query: IssueQuery = {}) =>
      request<Issue[]>(`/issues${toQueryString(query)}`),
    get: (key: string) => request<Issue>(`/issues/${key}`),
    fields: (key: string) => request<FlattenedField[]>(`/issues/${key}/fields`),
    triage: (key: string, data: TriagePayload) =>
      request<Issue>(`/issues/${key}/triage`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },
  filters: {
    list: () => request<SavedFilter[]>('/filters'),
    create: (data: { name: string; query: Record<string, unknown>; sortOrder?: number }) =>
      request<SavedFilter>('/filters', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<{ name: string; query: Record<string, unknown>; sortOrder: number }>) =>
      request<SavedFilter>(`/filters/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    remove: (id: string) =>
      request<void>(`/filters/${id}`, { method: 'DELETE' }),
  },
  metrics: {
    health: () => request<HealthMetrics>('/metrics/health'),
  },
  notes: {
    list: (projectKey?: string) =>
      request<PoNote[]>(
        `/notes${projectKey ? `?projectKey=${encodeURIComponent(projectKey)}` : ''}`,
      ),
    get: (jiraKey: string) => request<PoNote | null>(`/notes/${jiraKey}`),
    upsert: (jiraKey: string, data: PoNoteUpsert) =>
      request<PoNote | null>(`/notes/${jiraKey}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    remove: (jiraKey: string) =>
      request<{ ok: boolean }>(`/notes/${jiraKey}`, { method: 'DELETE' }),
  },
}
