import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Query,
} from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { PO_STATUS_VALUES } from '../common/po-status';
import { NotesService } from './notes.service';

class UpsertNoteBody {
  @IsOptional()
  @IsString()
  @MaxLength(10_000)
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  color?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @ValidateIf((_, value) => value != null)
  @IsIn([...PO_STATUS_VALUES])
  poStatus?: string | null;
}

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  list(@Query('projectKey') projectKey?: string) {
    return this.notesService.listByProject(projectKey);
  }

  @Get(':jiraKey')
  getOne(@Param('jiraKey') jiraKey: string) {
    return this.notesService.getByJiraKey(jiraKey);
  }

  @Put(':jiraKey')
  upsert(@Param('jiraKey') jiraKey: string, @Body() body: UpsertNoteBody) {
    return this.notesService.upsertByJiraKey(jiraKey, body);
  }

  @Delete(':jiraKey')
  remove(@Param('jiraKey') jiraKey: string) {
    return this.notesService.removeByJiraKey(jiraKey);
  }
}
