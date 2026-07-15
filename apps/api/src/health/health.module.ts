import { Module } from '@nestjs/common';
import { JiraModule } from '../jira/jira.module';
import { HealthController } from './health.controller';

@Module({
  imports: [JiraModule],
  controllers: [HealthController],
})
export class HealthModule {}
