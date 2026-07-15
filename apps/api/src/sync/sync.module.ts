import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { JiraModule } from '../jira/jira.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { SyncScheduler } from './sync.scheduler';
import { SyncService } from './sync.service';

@Module({
  imports: [ScheduleModule.forRoot(), JiraModule, RealtimeModule],
  providers: [SyncService, SyncScheduler],
  exports: [SyncService, SyncScheduler],
})
export class SyncModule {}
