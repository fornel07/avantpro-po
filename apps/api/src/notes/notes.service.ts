import { Injectable, NotFoundException } from '@nestjs/common';
import { isPoStatus } from '../common/po-status';
import { PrismaService } from '../prisma/prisma.service';

export interface UpsertNoteDto {
  content?: string;
  color?: string;
  poStatus?: string | null;
}

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  async listByProject(projectKey?: string) {
    return this.prisma.poNote.findMany({
      where: projectKey
        ? { issue: { board: { projectKey } } }
        : undefined,
      orderBy: { updatedAt: 'desc' },
      include: {
        issue: {
          select: {
            jiraKey: true,
            summary: true,
            sprint: true,
            issueType: true,
            board: { select: { projectKey: true, projectName: true } },
          },
        },
      },
    });
  }

  async getByJiraKey(jiraKey: string) {
    return this.prisma.poNote.findFirst({
      where: { jiraKey: jiraKey.toUpperCase() },
    });
  }

  async upsertByJiraKey(jiraKey: string, dto: UpsertNoteDto) {
    const issue = await this.prisma.issue.findUnique({
      where: { jiraKey: jiraKey.toUpperCase() },
    });
    if (!issue) {
      throw new NotFoundException(`Issue ${jiraKey} not found`);
    }

    const content = dto.content?.trim() ?? '';
    const poStatus =
      dto.poStatus === undefined
        ? undefined
        : dto.poStatus === null || dto.poStatus === ''
          ? null
          : isPoStatus(dto.poStatus)
            ? dto.poStatus
            : null;

    const existing = await this.prisma.poNote.findUnique({
      where: { issueId: issue.id },
    });

    const nextStatus =
      poStatus !== undefined ? poStatus : (existing?.poStatus ?? null);
    const nextContent =
      dto.content !== undefined ? content : (existing?.content ?? '');

    if (!nextContent && !nextStatus) {
      await this.prisma.poNote.deleteMany({ where: { issueId: issue.id } });
      return null;
    }

    return this.prisma.poNote.upsert({
      where: { issueId: issue.id },
      create: {
        issueId: issue.id,
        jiraKey: issue.jiraKey,
        content: nextContent,
        poStatus: nextStatus,
        color: dto.color ?? '#FDE68A',
      },
      update: {
        ...(dto.content !== undefined ? { content: nextContent } : {}),
        ...(poStatus !== undefined ? { poStatus: nextStatus } : {}),
        ...(dto.color ? { color: dto.color } : {}),
        jiraKey: issue.jiraKey,
      },
    });
  }

  async removeByJiraKey(jiraKey: string) {
    await this.prisma.poNote.deleteMany({
      where: { jiraKey: jiraKey.toUpperCase() },
    });
    return { ok: true };
  }
}
