import { Module } from '@nestjs/common';
import { JiraService } from './jira.service';

@Module({
  providers: [JiraService],
  exports: [JiraService],
})
export class JiraModule {}
