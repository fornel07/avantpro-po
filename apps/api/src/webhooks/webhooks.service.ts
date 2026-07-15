import {
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { RedisService } from '../redis/redis.service';
import { SyncService } from '../sync/sync.service';
import { JiraIssue } from '../jira/jira.types';

export interface JiraWebhookPayload {
  webhookEvent?: string;
  issue?: JiraIssue;
  issue_event_type_name?: string;
  timestamp?: number;
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly sync: SyncService,
  ) {}

  validateSecret(
    headers: Record<string, string | string[] | undefined>,
    rawBody?: string,
  ): void {
    const secret = this.config.get<string>('JIRA_WEBHOOK_SECRET');
    if (!secret) {
      return;
    }

    const headerSecret =
      this.getHeader(headers, 'x-jira-webhook-secret') ??
      this.getHeader(headers, 'x-hub-signature');

    if (!headerSecret) {
      throw new UnauthorizedException('Missing webhook secret');
    }

    if (headerSecret.startsWith('sha256=') && rawBody) {
      const provided = Buffer.from(headerSecret.slice(7), 'hex');
      const expected = createHmac('sha256', secret)
        .update(rawBody)
        .digest();
      if (
        provided.length !== expected.length ||
        !timingSafeEqual(provided, expected)
      ) {
        throw new UnauthorizedException('Invalid webhook signature');
      }
      return;
    }

    if (headerSecret !== secret) {
      throw new UnauthorizedException('Invalid webhook secret');
    }
  }

  async handleJiraWebhook(payload: JiraWebhookPayload): Promise<{ ok: boolean }> {
    const event =
      payload.webhookEvent ??
      payload.issue_event_type_name ??
      'unknown';

    await this.redis.publish('connection.status', {
      source: 'jira-webhook',
      event,
      receivedAt: new Date().toISOString(),
    });

    if (!payload.issue) {
      this.logger.warn(`Webhook ${event} received without issue payload`);
      return { ok: true };
    }

    if (event.includes('deleted') || event === 'jira:issue_deleted') {
      await this.redis.publish('issue.deleted', {
        jiraKey: payload.issue.key,
      });
      await this.sync.deleteIssueByKey(payload.issue.key);
      return { ok: true };
    }

    await this.redis.publish(
      event.includes('created') ? 'issue.created' : 'issue.updated',
      payload,
    );

    await this.sync.upsertIssueFromJiraPayload(payload.issue);
    return { ok: true };
  }

  private getHeader(
    headers: Record<string, string | string[] | undefined>,
    name: string,
  ): string | undefined {
    const value = headers[name] ?? headers[name.toLowerCase()];
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }
}
