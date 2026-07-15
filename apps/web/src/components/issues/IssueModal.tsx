import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronDown, ExternalLink } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { api } from '@/lib/api'
import { PoStatusSelect } from '../notes/PoStatusSelect'
import { cn, formatHoursFromSeconds } from '@/lib/utils'
import { Badge, priorityVariant, typeVariant } from '../ui/badge'
import { Button } from '../ui/button'
import { Dialog } from '../ui/dialog-or-sheet'
import { FieldRenderer } from './FieldRenderer'

interface SubtaskItem {
  key?: string
  fields?: {
    summary?: string
    status?: { name?: string; statusCategory?: { key?: string } }
  }
}

interface IssueModalProps {
  issueKey: string | null
  onClose: () => void
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2 border-b border-[var(--border)] py-2.5 text-sm last:border-b-0">
      <dt className="text-xs font-medium text-[var(--text-muted)]">{label}</dt>
      <dd className="text-[var(--text)]">{children}</dd>
    </div>
  )
}

function isSubtaskDone(st: SubtaskItem): boolean {
  const category = st.fields?.status?.statusCategory?.key?.toLowerCase()
  const status = st.fields?.status?.name?.toLowerCase() ?? ''
  return (
    category === 'done' ||
    status.includes('done') ||
    status.includes('conclu') ||
    status.includes('fechad') ||
    status.includes('resolved')
  )
}

export function IssueModal({ issueKey, onClose }: IssueModalProps) {
  const queryClient = useQueryClient()
  const [showAllFields, setShowAllFields] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')
  const [poStatusDraft, setPoStatusDraft] = useState<string | null>(null)

  const { data: issue, isLoading: issueLoading } = useQuery({
    queryKey: ['issue', issueKey],
    queryFn: () => api.issues.get(issueKey!),
    enabled: !!issueKey,
  })

  const { data: fields, isLoading: fieldsLoading } = useQuery({
    queryKey: ['issue-fields', issueKey],
    queryFn: () => api.issues.fields(issueKey!),
    enabled: !!issueKey,
  })

  useEffect(() => {
    setNoteDraft(issue?.poNote?.content ?? '')
    setPoStatusDraft(issue?.poNote?.poStatus ?? null)
  }, [issue?.poNote?.content, issue?.poNote?.poStatus, issueKey])

  const saveNoteMutation = useMutation({
    mutationFn: (payload: { content: string; poStatus: string | null }) =>
      api.notes.upsert(issueKey!, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['issues'] })
      void queryClient.invalidateQueries({ queryKey: ['issue', issueKey] })
      void queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })

  const open = !!issueKey
  const loading = issueLoading || fieldsLoading
  const subtasks = (Array.isArray(issue?.subtasks) ? issue.subtasks : []) as SubtaskItem[]

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={issue ? issue.jiraKey : 'Carregando…'}
      className="max-w-6xl"
    >
      {loading && (
        <div className="flex items-center justify-center py-24 text-sm text-[var(--text-muted)]">
          Carregando detalhes…
        </div>
      )}

      {issue && (
        <div className="flex min-h-0 flex-col lg:flex-row">
          {/* Left panel — main content */}
          <div className="min-w-0 flex-[2] border-b border-[var(--border)] p-5 lg:border-b-0 lg:border-r">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-semibold text-[var(--primary)]">
                {issue.jiraKey}
              </span>
              <Badge variant={typeVariant(issue.issueType)}>
                {issue.issueType ?? '—'}
              </Badge>
            </div>

            <h1 className="mb-5 text-xl font-semibold leading-snug text-[var(--text)]">
              {issue.summary}
            </h1>

            {issue.description ? (
              <section className="mb-6">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Descrição
                </h2>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/30 p-4 text-sm leading-relaxed text-[var(--text)] whitespace-pre-wrap">
                  {issue.description}
                </div>
              </section>
            ) : (
              <p className="mb-6 text-sm italic text-[var(--text-muted)]">
                Sem descrição.
              </p>
            )}

            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Subtasks
                {subtasks.length > 0 && (
                  <span className="ml-2 font-normal normal-case text-[var(--text-muted)]">
                    ({subtasks.length})
                  </span>
                )}
              </h2>

              {subtasks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-6 text-center text-sm text-[var(--text-muted)]">
                  Nenhuma subtask.
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-[var(--border)]">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--bg)]/50 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        <th className="w-10 px-3 py-2" />
                        <th className="px-3 py-2">Chave</th>
                        <th className="px-3 py-2">Resumo</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subtasks.map((st, i) => {
                        const done = isSubtaskDone(st)
                        return (
                          <tr
                            key={st.key ?? i}
                            className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--row-hover)]"
                          >
                            <td className="px-3 py-2.5">
                              <span
                                className={cn(
                                  'flex h-5 w-5 items-center justify-center rounded border',
                                  done
                                    ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-400'
                                    : 'border-[var(--border)] bg-[var(--surface)]',
                                )}
                                aria-hidden
                              >
                                {done && <Check className="h-3 w-3" />}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5">
                              {st.key ? (
                                <a
                                  href={`${issue.browseUrl?.replace(/\/browse\/[^/]+$/, '') ?? ''}/browse/${st.key}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-mono text-xs text-[var(--primary)] hover:underline"
                                >
                                  {st.key}
                                </a>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="max-w-xs truncate px-3 py-2.5 text-[var(--text)]">
                              {st.fields?.summary ?? '—'}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5">
                              <Badge>{st.fields?.status?.name ?? '—'}</Badge>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          {/* Right panel — details */}
          <div className="min-w-0 flex-1 shrink-0 p-5">
            <div id="po-note" className="mb-4 space-y-3 rounded-xl border border-[var(--border)] bg-[var(--bg)]/40 p-3">
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Status de produto
                </p>
                <PoStatusSelect
                  compact={false}
                  value={poStatusDraft}
                  onChange={setPoStatusDraft}
                  className="max-w-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Nota / pendência
                </label>
                <textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  rows={4}
                  className="w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-[var(--primary)]/25"
                  placeholder="Anota pendências, contexto ou decisão deste card…"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  disabled={saveNoteMutation.isPending}
                  onClick={() =>
                    saveNoteMutation.mutate({
                      content: noteDraft.trim(),
                      poStatus: poStatusDraft,
                    })
                  }
                >
                  {saveNoteMutation.isPending ? 'Salvando…' : 'Salvar'}
                </Button>
              </div>
            </div>

            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Detalhes
            </h2>
            <dl>
              <DetailRow label="Status">
                <Badge>{issue.status ?? '—'}</Badge>
              </DetailRow>
              <DetailRow label="Assignee">{issue.assignee ?? '—'}</DetailRow>
              <DetailRow label="Reporter">{issue.reporter ?? '—'}</DetailRow>
              <DetailRow label="Prioridade">
                <Badge variant={priorityVariant(issue.priority)}>
                  {issue.priority ?? '—'}
                </Badge>
              </DetailRow>
              <DetailRow label="Sprint">{issue.sprint ?? '—'}</DetailRow>
              <DetailRow label="Story points">
                {issue.storyPoints ?? '—'}
              </DetailRow>
              <DetailRow label="Labels">
                {issue.labels.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {issue.labels.map((l) => (
                      <Badge key={l} variant="primary">
                        {l}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  '—'
                )}
              </DetailRow>
              <DetailRow label="Components">
                {issue.components.length > 0 ? issue.components.join(', ') : '—'}
              </DetailRow>
              <DetailRow label="Time tracking">
                <div className="space-y-1 text-xs">
                  <p>
                    <span className="text-[var(--text-muted)]">Original: </span>
                    {formatHoursFromSeconds(issue.originalEstimateSeconds)}
                  </p>
                  <p>
                    <span className="text-[var(--text-muted)]">Restante: </span>
                    {formatHoursFromSeconds(issue.remainingEstimateSeconds)}
                  </p>
                  <p>
                    <span className="text-[var(--text-muted)]">Gasto: </span>
                    {formatHoursFromSeconds(issue.timeSpentSeconds)}
                  </p>
                </div>
              </DetailRow>
            </dl>

            {issue.browseUrl && (
              <a
                href={issue.browseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-3 py-2.5 text-sm font-medium text-[var(--primary)] transition-colors hover:bg-[var(--primary)]/20"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir no Jira
              </a>
            )}
          </div>
        </div>
      )}

      {issue && fields && fields.length > 0 && (
        <div className="border-t border-[var(--border)] px-5 py-3">
          <button
            type="button"
            onClick={() => setShowAllFields((s) => !s)}
            className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
          >
            Todos os campos
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform',
                showAllFields && 'rotate-180',
              )}
            />
          </button>
          {showAllFields && (
            <div className="mt-3 max-h-64 overflow-y-auto pb-2">
              <FieldRenderer fields={fields} />
            </div>
          )}
        </div>
      )}
    </Dialog>
  )
}
