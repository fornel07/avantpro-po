import { Module } from '@nestjs/common';
import { JiraModule } from '../jira/jira.module';
import { SyncModule } from '../sync/sync.module';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';

@Module({
  imports: [JiraModule, SyncModule],
  controllers: [BoardsController],
  providers: [BoardsService],
})
export class BoardsModule {}
