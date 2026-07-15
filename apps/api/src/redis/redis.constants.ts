export const REALTIME_CHANNEL = 'avantpro:realtime';

export type RealtimeEventType =
  | 'issue.updated'
  | 'issue.created'
  | 'issue.deleted'
  | 'sync.completed'
  | 'connection.status';

export interface RealtimeEnvelope<T = unknown> {
  type: RealtimeEventType;
  payload: T;
  timestamp: string;
}
