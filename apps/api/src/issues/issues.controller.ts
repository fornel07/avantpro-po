import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { IssueQueryDto, TriageIssueDto } from './dto/issue.dto';
import { IssuesService } from './issues.service';

@Controller('issues')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Get()
  findAll(@Query() query: IssueQueryDto) {
    return this.issuesService.findAll(query);
  }

  @Get(':key/fields')
  getFields(@Param('key') key: string) {
    return this.issuesService.getFlattenedFields(key);
  }

  @Get(':key')
  findOne(@Param('key') key: string) {
    return this.issuesService.findByKey(key);
  }

  @Patch(':key/triage')
  triage(@Param('key') key: string, @Body() dto: TriageIssueDto) {
    return this.issuesService.triage(key, dto);
  }
}
