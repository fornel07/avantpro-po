/** Local product-side statuses (never synced to Jira). */
export const PO_STATUS_VALUES = [
  'devolvido_dev',
  'aguardando_dev',
  'homologacao',
  'concluido',
] as const;

export type PoStatusValue = (typeof PO_STATUS_VALUES)[number];

export function isPoStatus(value: unknown): value is PoStatusValue {
  return (
    typeof value === 'string' &&
    (PO_STATUS_VALUES as readonly string[]).includes(value)
  );
}
