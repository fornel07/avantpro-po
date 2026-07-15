import { Controller, Get } from '@nestjs/common';
import { JiraService } from '../jira/jira.service';
import { RedisService } from '../redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly jira: JiraService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  getHealth() {
    return {
      ok: true,
      jiraConfigured: this.jira.isConfigured(),
      redisConnected: this.redis.isConnected(),
      websocket: true,
      mode: 'poll-sync',
    };
  }
}
