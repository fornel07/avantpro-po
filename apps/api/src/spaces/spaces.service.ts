import { Injectable } from '@nestjs/common';
import {
  shouldSyncAllIssueTypes,
  SUSTENTACAO_ISSUE_TYPES,
} from '../common/sustentacao';
import { PrismaService } from '../prisma/prisma.service';

export interface SpaceDto {
  projectKey: string;
  name: string;
  avatarUrl: string | null;
  boardIds: string[];
  issueCount: number;
  syncMode: 'all' | 'sustentacao';
  sprints: Array<{ name: string; issueCount: number }>;
}

@Injectable()
export class SpacesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<SpaceDto[]> {
    const boards = await this.prisma.board.findMany({
      orderBy: { projectKey: 'asc' },
    });

    const byProject = new Map<
      string,
      {
        projectKey: string;
        name: string;
        avatarUrl: string | null;
        boardIds: string[];
      }
    >();

    for (const board of boards) {
      const existing = byProject.get(board.projectKey);
      if (existing) {
        existing.boardIds.push(board.id);
        if (!existing.avatarUrl && board.avatarUrl) {
          existing.avatarUrl = board.avatarUrl;
        }
        if (board.projectName) {
          existing.name = board.projectName;
        }
      } else {
        byProject.set(board.projectKey, {
          projectKey: board.projectKey,
          name: board.projectName ?? board.name,
          avatarUrl: board.avatarUrl,
          boardIds: [board.id],
        });
      }
    }

    const spaces: SpaceDto[] = [];

    for (const space of byProject.values()) {
      const syncAll = shouldSyncAllIssueTypes(space.projectKey);
      const issues = await this.prisma.issue.findMany({
        where: {
          boardId: { in: space.boardIds },
          ...(syncAll
            ? {}
            : {
                OR: SUSTENTACAO_ISSUE_TYPES.map((type) => ({
                  issueType: { equals: type, mode: 'insensitive' as const },
                })),
              }),
        },
        select: { sprint: true },
      });

      const sprintCounts = new Map<string, number>();
      for (const issue of issues) {
        const key = issue.sprint?.trim() || 'Sem sprint';
        sprintCounts.set(key, (sprintCounts.get(key) ?? 0) + 1);
      }

      const sprints = [...sprintCounts.entries()]
        .map(([name, issueCount]) => ({ name, issueCount }))
        .filter((s) => s.name !== 'Sem sprint')
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

      const noSprintCount = sprintCounts.get('Sem sprint') ?? 0;
      if (noSprintCount > 0) {
        sprints.push({ name: 'Sem sprint', issueCount: noSprintCount });
      }

      spaces.push({
        ...space,
        issueCount: issues.length,
        syncMode: syncAll ? 'all' : 'sustentacao',
        sprints,
      });
    }

    return spaces.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }
}
