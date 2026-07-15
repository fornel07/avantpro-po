/** Issue types kept in Avantpro PO sustentação sync/views. */
export const SUSTENTACAO_ISSUE_TYPES = [
  'Bug',
  'Melhoria',
  'Improvement',
] as const;

export const SUSTENTACAO_JQL = `type in (${SUSTENTACAO_ISSUE_TYPES.map((t) => `"${t}"`).join(', ')})`;

/** Projects that sync every active issue type (not only Bug/Melhoria). */
export const ALL_TYPES_PROJECT_KEYS = ['IDEIA'] as const;

export function isSustentacaoIssueType(type?: string | null): boolean {
  if (!type) return false;
  const normalized = type.trim().toLowerCase();
  return SUSTENTACAO_ISSUE_TYPES.some((t) => t.toLowerCase() === normalized);
}

export function shouldSyncAllIssueTypes(projectKey?: string | null): boolean {
  if (!projectKey) return false;
  return ALL_TYPES_PROJECT_KEYS.some(
    (key) => key.toLowerCase() === projectKey.trim().toLowerCase(),
  );
}
