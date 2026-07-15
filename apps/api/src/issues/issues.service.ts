import { Injectable, NotFoundException } from '@nestjs/common';
import { Issue, Prisma } from '@prisma/client';
import { SUSTENTACAO_ISSUE_TYPES } from '../common/sustentacao';
import { JiraService } from '../jira/jira.service';
import { JiraIssue } from '../jira/jira.types';
import { PrismaService } from '../prisma/prisma.service';
import { IssueQueryDto, TriageIssueDto } from './dto/issue.dto';

export interface FlattenedIssueField {
  key: string;
  name: string | null;
  value: unknown;
}

@Injectable()
export class IssuesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jira: JiraService,
  ) {}

  async findAll(query: IssueQueryDto) {
    const and: Prisma.IssueWhereInput[] = [];

    const split = (value?: string) =>
      (value ?? '')
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);

    if (query.boardId) {
      and.push({ boardId: query.boardId });
    }

    const projectKeys = split(query.projectKey);
    if (projectKeys.length === 1) {
      and.push({ board: { projectKey: projectKeys[0] } });
    } else if (projectKeys.length > 1) {
      and.push({ board: { projectKey: { in: projectKeys } } });
    }

    const types = split(query.type);
    if (query.sustentacao && types.length === 0) {
      and.push({
        OR: SUSTENTACAO_ISSUE_TYPES.map((type) => ({
          issueType: { equals: type, mode: 'insensitive' as const },
        })),
      });
    } else if (types.length === 1) {
      and.push({ issueType: { equals: types[0], mode: 'insensitive' } });
    } else if (types.length > 1) {
      and.push({
        OR: types.map((type) => ({
          issueType: { equals: type, mode: 'insensitive' as const },
        })),
      });
    }

    const priorities = split(query.priority);
    if (priorities.length === 1) {
      and.push({ priority: { equals: priorities[0], mode: 'insensitive' } });
    } else if (priorities.length > 1) {
      and.push({
        OR: priorities.map((priority) => ({
          priority: { equals: priority, mode: 'insensitive' as const },
        })),
      });
    }

    const statuses = split(query.status);
    if (statuses.length === 1) {
      and.push({ status: { equals: statuses[0], mode: 'insensitive' } });
    } else if (statuses.length > 1) {
      and.push({
        OR: statuses.map((status) => ({
          status: { equals: status, mode: 'insensitive' as const },
        })),
      });
    }

    const assignees = split(query.assignee);
    if (assignees.length === 1) {
      and.push({
        assignee: { contains: assignees[0], mode: 'insensitive' },
      });
    } else if (assignees.length > 1) {
      and.push({
        OR: assignees.map((assignee) => ({
          assignee: { contains: assignee, mode: 'insensitive' as const },
        })),
      });
    }

    const sprints = split(query.sprint);
    if (sprints.length === 1) {
      and.push({ sprint: { contains: sprints[0], mode: 'insensitive' } });
    } else if (sprints.length > 1) {
      and.push({
        OR: sprints.map((sprint) => ({
          sprint: { contains: sprint, mode: 'insensitive' as const },
        })),
      });
    }

    if (query.labels) {
      const labels = split(query.labels);
      if (labels.length > 0) {
        and.push({ labels: { hasSome: labels } });
      }
    }

    if (query.q) {
      // Skip description in list search — major lag on large payloads.
      and.push({
        OR: [
          { summary: { contains: query.q, mode: 'insensitive' } },
          { jiraKey: { contains: query.q, mode: 'insensitive' } },
        ],
      });
    }

    // Lean list payload: never ship raw/customFields/description JSON blobs.
    return this.prisma.issue.findMany({
      where: and.length > 0 ? { AND: and } : {},
      orderBy: [{ jiraUpdatedAt: 'desc' }, { updatedAt: 'desc' }],
      select: {
        id: true,
        jiraKey: true,
        jiraId: true,
        boardId: true,
        summary: true,
        issueType: true,
        status: true,
        statusCategory: true,
        priority: true,
        assignee: true,
        assigneeAccountId: true,
        reporter: true,
        sprint: true,
        storyPoints: true,
        originalEstimateSeconds: true,
        remainingEstimateSeconds: true,
        timeSpentSeconds: true,
        labels: true,
        components: true,
        fixVersions: true,
        browseUrl: true,
        parentKey: true,
        subtasks: true,
        jiraCreatedAt: true,
        jiraUpdatedAt: true,
        createdAt: true,
        updatedAt: true,
        poNote: {
          select: {
            id: true,
            content: true,
            poStatus: true,
            color: true,
            updatedAt: true,
          },
        },
        board: {
          select: {
            id: true,
            projectKey: true,
            projectName: true,
            avatarUrl: true,
            name: true,
          },
        },
      },
    });
  }

  async findByKey(key: string) {
    const issue = await this.prisma.issue.findUnique({
      where: { jiraKey: key.toUpperCase() },
      include: {
        poNote: {
          select: {
            id: true,
            content: true,
            poStatus: true,
            color: true,
            updatedAt: true,
          },
        },
      },
    });
    if (!issue) {
      throw new NotFoundException(`Issue ${key} not found`);
    }
    return issue;
  }

  async getFlattenedFields(key: string): Promise<FlattenedIssueField[]> {
    const issue = await this.findByKey(key);
    const raw = issue.raw as unknown as JiraIssue;
    const names = raw.names ?? {};
    const fields = raw.fields ?? {};

    const flattened: FlattenedIssueField[] = [];

    for (const [fieldKey, value] of Object.entries(fields)) {
      flattened.push({
        key: fieldKey,
        name: names[fieldKey] ?? null,
        value,
      });
    }

    if (raw.changelog) {
      flattened.push({
        key: 'changelog',
        name: 'Changelog',
        value: raw.changelog,
      });
    }

    if (raw.renderedFields) {
      flattened.push({
        key: 'renderedFields',
        name: 'Rendered Fields',
        value: raw.renderedFields,
      });
    }

    flattened.sort((a, b) => {
      const nameA = a.name ?? a.key;
      const nameB = b.name ?? b.key;
      return nameA.localeCompare(nameB);
    });

    return flattened;
  }

  async triage(key: string, dto: TriageIssueDto): Promise<Issue> {
    const issue = await this.findByKey(key);
    const updateData: Prisma.IssueUpdateInput = {};

    if (dto.priority) {
      updateData.priority = dto.priority;
    }
    if (dto.status) {
      updateData.status = dto.status;
    }
    if (dto.assignee) {
      updateData.assignee = dto.assignee;
    }

    if (this.jira.isConfigured()) {
      try {
        const fields: Record<string, unknown> = {};
        if (dto.priority) {
          fields.priority = { name: dto.priority };
        }
        if (dto.assignee) {
          fields.assignee = { name: dto.assignee };
        }
        if (Object.keys(fields).length > 0) {
          await this.jira.updateIssueFields(issue.jiraKey, fields);
        }
        if (dto.status) {
          const transitions = await this.jira.getTransitions(issue.jiraKey);
          const transition = transitions.find(
            (t) => t.to.name.toLowerCase() === dto.status!.toLowerCase(),
          );
          if (transition) {
            await this.jira.transitionIssue(issue.jiraKey, transition.id);
            updateData.status = transition.to.name;
          }
        }
      } catch {
        // Fall back to local-only update when Jira call fails.
      }
    }

    if (Object.keys(updateData).length === 0 && !dto.status) {
      return issue;
    }

    const raw = { ...(issue.raw as Record<string, unknown>) };
    if (raw.fields && typeof raw.fields === 'object') {
      const fields = raw.fields as Record<string, unknown>;
      if (dto.priority) {
        fields.priority = { name: dto.priority };
      }
      if (dto.status) {
        fields.status = {
          ...(fields.status as Record<string, unknown>),
          name: dto.status,
        };
      }
      if (dto.assignee) {
        fields.assignee = { displayName: dto.assignee };
      }
    }

    return this.prisma.issue.update({
      where: { id: issue.id },
      data: {
        ...updateData,
        raw: raw as Prisma.InputJsonValue,
      },
    });
  }
}
