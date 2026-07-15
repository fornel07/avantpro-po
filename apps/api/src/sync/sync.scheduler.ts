import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JiraService } from '../jira/jira.service';
import { SyncService } from './sync.service';

@Injectable()
export class SyncScheduler {
  private readonly logger = new Logger(SyncScheduler.name);
  private running = false;

  constructor(
    private readonly sync: SyncService,
    private readonly jira: JiraService,
    private readonly config: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlySync(): Promise<void> {
    const enabled =
      this.config.get<string>('SYNC_CRON_ENABLED', 'true').toLowerCase() !==
      'false';

    if (!enabled) {
      this.logger.debug('Hourly sync disabled (SYNC_CRON_ENABLED=false)');
      return;
    }

    await this.runScheduledSync('cron:hourly');
  }

  async runScheduledSync(source: string): Promise<void> {
    if (!this.jira.isConfigured()) {
      this.logger.warn(
        `Skipping ${source} sync — Jira credentials are not configured`,
      );
      return;
    }

    if (this.running) {
      this.logger.warn(`Skipping ${source} sync — previous run still in progress`);
      return;
    }

    this.running = true;
    const started = Date.now();

    try {
      this.logger.log(`Starting ${source} sync of active issues...`);
      const results = await this.sync.syncAllConfiguredBoards({
        activeOnly: true,
      });
      const total = results.reduce((sum, item) => sum + item.issuesSynced, 0);
      this.logger.log(
        `Finished ${source} sync: ${results.length} board(s), ${total} active issue(s) in ${Date.now() - started}ms`,
      );
    } catch (error) {
      this.logger.error(`Failed ${source} sync: ${String(error)}`);
    } finally {
      this.running = false;
    }
  }
}
