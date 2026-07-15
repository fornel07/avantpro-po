import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BoardsModule } from './boards/boards.module';
import { FiltersModule } from './filters/filters.module';
import { HealthModule } from './health/health.module';
import { IssuesModule } from './issues/issues.module';
import { JiraModule } from './jira/jira.module';
import { MetricsModule } from './metrics/metrics.module';
import { NotesModule } from './notes/notes.module';
import { PrismaModule } from './prisma/prisma.module';
import { RealtimeModule } from './realtime/realtime.module';
import { RedisModule } from './redis/redis.module';
import { SpacesModule } from './spaces/spaces.module';
import { SyncModule } from './sync/sync.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    RedisModule,
    RealtimeModule,
    JiraModule,
    SyncModule,
    BoardsModule,
    IssuesModule,
    FiltersModule,
    WebhooksModule,
    MetricsModule,
    HealthModule,
    SpacesModule,
    NotesModule,
  ],
})
export class AppModule {}

