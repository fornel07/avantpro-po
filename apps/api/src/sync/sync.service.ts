import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Issue, Prisma } from '@prisma/client';
import { JiraService } from '../jira/jira.service';
import { JiraIssue } from '../jira/jira.types';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';

import {
  isSustentacaoIssueType,
  shouldSyncAllIssueTypes,
  SUSTENTACAO_JQL,
} from '../common/sustentacao';

export interface SyncBoardOptions {
  activeOnly?: boolean;
  /** Default true — only Bug / Melhoria / Improvement */
  sustentacaoOnly?: boolean;
}

export interface SyncBoardResult {
  boardId: string;
  jiraBoardId: number;
  issuesSynced: number;
  issuesRefreshed: number;
}

/** Demo boards created by the old seed (removed). */
const DEMO_JIRA_BOARD_IDS = [101, 102];

@Injectable()
export class SyncService implements OnModuleInit {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jira: JiraService,
    private readonly realtime: RealtimeService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.purgeDemoData();

    // Defer first sync so Nest finishes bootstrapping (avoids circular SyncScheduler inject).
    setTimeout(() => {
      void this.bootstrapSync();
    }, 2_000);
  }

  private async bootstrapSync(): Promise<void> {
    if (!this.jira.isConfigured()) {
      this.logger.warn(
        'Jira is not configured — skipping startup sync. Add boards after setting JIRA_* env vars.',
      );
      return;
    }

    const boards = await this.prisma.board.count();
    if (boards === 0) {
      this.logger.log(
        'No boards configured yet — add a board in the UI to start syncing active cards.',
      );
      return;
    }

    this.logger.log('Running startup sync of active issues...');
    try {
      const results = await this.syncAllConfiguredBoards({ activeOnly: true });
      const total = results.reduce((sum, item) => sum + item.issuesSynced, 0);
      this.logger.log(
        `Startup sync done: ${results.length} board(s), ${total} active issue(s)`,
      );
    } catch (error) {
      this.logger.error(`Startup sync failed: ${String(error)}`);
    }
  }

  async purgeDemoData(): Promise<void> {
    const demoBoards = await this.prisma.board.findMany({
      where: { jiraBoardId: { in: DEMO_JIRA_BOARD_IDS } },
      select: { id: true },
    });

    const demoIssues = await this.prisma.issue.findMany({
      where: {
        OR: [
          { browseUrl: { contains: 'demo.atlassian.net' } },
          { boardId: { in: demoBoards.map((b) => b.id) } },
        ],
      },
      select: { id: true },
    });

    if (demoBoards.length === 0 && demoIssues.length === 0) {
      await this.prisma.savedFilter.deleteMany({
        where: { id: { startsWith: 'demo-' } },
      });
      return;
    }

    this.logger.log(
      `Removing mock data: ${demoBoards.length} board(s), ${demoIssues.length} issue(s)`,
    );

    await this.prisma.issue.deleteMany({
      where: { id: { in: demoIssues.map((i) => i.id) } },
    });
    await this.prisma.board.deleteMany({
      where: { jiraBoardId: { in: DEMO_JIRA_BOARD_IDS } },
    });
    await this.prisma.savedFilter.deleteMany({
      where: { id: { startsWith: 'demo-' } },
    });
  }

  async syncBoard(
    boardIdOrJiraId: string,
    options: SyncBoardOptions = { activeOnly: true, sustentacaoOnly: true },
  ): Promise<SyncBoardResult> {
    if (!this.jira.isConfigured()) {
      throw new Error('Jira is not configured');
    }

    const activeOnly = options.activeOnly !== false;
    const board = await this.resolveBoard(boardIdOrJiraId);
    const jiraBoard = await this.jira.getBoard(board.jiraBoardId);

    let projectName = board.projectName ?? jiraBoard.location?.projectName ?? null;
    let avatarUrl = board.avatarUrl ?? null;
    const projectKey =
      jiraBoard.location?.projectKey ?? board.projectKey ?? 'UNKNOWN';

    // Banco de ideias (IDEIA) imports every active card; other spaces keep Bug/Melhoria only.
    const sustentacaoOnly = shouldSyncAllIssueTypes(projectKey)
      ? false
      : options.sustentacaoOnly !== false;

    try {
      const project = await this.jira.getProject(projectKey);
      projectName = project.name ?? projectName;
      avatarUrl =
        project.avatarUrls?.['48x48'] ??
        project.avatarUrls?.['32x32'] ??
        project.avatarUrls?.['24x24'] ??
        avatarUrl;
    } catch (error) {
      this.logger.warn(
        `Could not load project ${projectKey}: ${String(error)}`,
      );
    }

    this.logger.log(
      `Syncing board ${jiraBoard.name} (${projectKey}) — mode=${sustentacaoOnly ? 'sustentacao' : 'all-types'}`,
    );

    const issuesResponse = await this.jira.getBoardIssues(board.jiraBoardId, {
      activeOnly,
      jql: sustentacaoOnly ? SUSTENTACAO_JQL : undefined,
    });

    const updatedBoard = await this.prisma.board.update({
      where: { id: board.id },
      data: {
        name: jiraBoard.name,
        projectKey,
        projectName,
        avatarUrl,
        type: jiraBoard.type ?? board.type,
      },
    });

    const syncedKeys = new Set<string>();
    let issuesSynced = 0;

    for (const jiraIssue of issuesResponse.issues) {
      const typeName = jiraIssue.fields?.issuetype?.name;
      if (sustentacaoOnly && !isSustentacaoIssueType(typeName)) {
        continue;
      }
      await this.upsertIssueFromJiraPayload(jiraIssue, updatedBoard.id, true);
      syncedKeys.add(jiraIssue.key);
      issuesSynced += 1;
    }

    // Keep local snapshot aligned with what we just pulled for this board.
    await this.prisma.issue.deleteMany({
      where: {
        boardId: updatedBoard.id,
        ...(syncedKeys.size > 0
          ? { jiraKey: { notIn: [...syncedKeys] } }
          : {}),
      },
    });

    const issuesRefreshed = 0;

    const result: SyncBoardResult = {
      boardId: updatedBoard.id,
      jiraBoardId: updatedBoard.jiraBoardId,
      issuesSynced,
      issuesRefreshed,
    };

    await this.realtime.emitSyncCompleted({
      ...result,
      activeOnly,
      sustentacaoOnly,
      source: 'sync',
    });

    return result;
  }

  async syncAllConfiguredBoards(
    options: SyncBoardOptions = { activeOnly: true, sustentacaoOnly: true },
  ): Promise<SyncBoardResult[]> {
    const boards = await this.prisma.board.findMany();
    const results: SyncBoardResult[] = [];

    for (const board of boards) {
      try {
        const result = await this.syncBoard(board.id, options);
        results.push(result);
      } catch (error) {
        this.logger.error(
          `Failed to sync board ${board.id} (${board.name}): ${String(error)}`,
        );
      }
    }

    return results;
  }

  async upsertIssueFromJiraPayload(
    payload: JiraIssue | Record<string, unknown>,
    boardId?: string,
    notify = true,
  ): Promise<Issue> {
    const jiraIssue = payload as JiraIssue;
    const record = this.jira.mapIssueToRecord(jiraIssue, boardId);
    const data = this.toPrismaIssueData(record);

    const existing = await this.prisma.issue.findUnique({
      where: { jiraKey: record.jiraKey },
    });

    const issue = existing
      ? await this.prisma.issue.update({
          where: { id: existing.id },
          data,
        })
      : await this.prisma.issue.create({ data });

    if (notify) {
      if (existing) {
        await this.realtime.emitIssueUpdated(issue);
      } else {
        await this.realtime.emitIssueCreated(issue);
      }
    }

    return issue;
  }

  async deleteIssueByKey(jiraKey: string, notify = true): Promise<void> {
    const issue = await this.prisma.issue.findUnique({ where: { jiraKey } });
    if (!issue) {
      return;
    }

    await this.prisma.issue.delete({ where: { id: issue.id } });

    if (notify) {
      await this.realtime.emitIssueDeleted({ jiraKey, id: issue.id });
    }
  }

  /**
   * Issues that left the "active" JQL set are refreshed once from Jira
   * so Done/Closed statuses propagate without keeping stale "In Progress" rows.
   */
  private async refreshIssuesLeftActiveSet(
    boardId: string,
    activeKeys: Set<string>,
  ): Promise<number> {
    const stale = await this.prisma.issue.findMany({
      where: {
        boardId,
        jiraKey: { notIn: [...activeKeys] },
        OR: [
          { statusCategory: { notIn: ['Done', 'done'] } },
          { statusCategory: null },
        ],
      },
      select: { jiraKey: true },
    });

    let refreshed = 0;
    for (const item of stale) {
      try {
        const jiraIssue = await this.jira.getIssue(item.jiraKey);
        await this.upsertIssueFromJiraPayload(jiraIssue, boardId, true);
        refreshed += 1;
      } catch (error) {
        this.logger.warn(
          `Could not refresh ${item.jiraKey}: ${String(error)} — removing local snapshot`,
        );
        await this.deleteIssueByKey(item.jiraKey, true);
      }
    }

    return refreshed;
  }

  private async resolveBoard(boardIdOrJiraId: string) {
    const byId = await this.prisma.board.findUnique({
      where: { id: boardIdOrJiraId },
    });
    if (byId) {
      return byId;
    }

    const jiraBoardId = Number(boardIdOrJiraId);
    if (!Number.isNaN(jiraBoardId)) {
      const byJiraId = await this.prisma.board.findUnique({
        where: { jiraBoardId },
      });
      if (byJiraId) {
        return byJiraId;
      }
    }

    throw new Error(`Board not found: ${boardIdOrJiraId}`);
  }

  private toPrismaIssueData(
    record: ReturnType<JiraService['mapIssueToRecord']>,
  ): Prisma.IssueUncheckedCreateInput {
    return {
      jiraKey: record.jiraKey,
      jiraId: record.jiraId,
      boardId: record.boardId ?? null,
      summary: record.summary,
      description: record.description,
      issueType: record.issueType,
      status: record.status,
      statusCategory: record.statusCategory,
      priority: record.priority,
      assignee: record.assignee,
      assigneeAccountId: record.assigneeAccountId,
      reporter: record.reporter,
      sprint: record.sprint,
      storyPoints: record.storyPoints,
      originalEstimateSeconds: record.originalEstimateSeconds,
      remainingEstimateSeconds: record.remainingEstimateSeconds,
      timeSpentSeconds: record.timeSpentSeconds,
      labels: record.labels,
      components: record.components,
      fixVersions: record.fixVersions,
      browseUrl: record.browseUrl,
      parentKey: record.parentKey,
      subtasks: record.subtasks as Prisma.InputJsonValue,
      customFields: record.customFields as Prisma.InputJsonValue,
      raw: record.raw as Prisma.InputJsonValue,
      jiraCreatedAt: record.jiraCreatedAt,
      jiraUpdatedAt: record.jiraUpdatedAt,
    };
  }
}
