import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  IssueRecordData,
  JiraBoard,
  JiraBoardIssuesResponse,
  JiraBoardListResponse,
  JiraIssue,
  JiraIssueFields,
  JiraSearchResponse,
  JiraSprint,
} from './jira.types';

const STANDARD_FIELD_KEYS = new Set([
  'summary',
  'description',
  'issuetype',
  'status',
  'priority',
  'assignee',
  'reporter',
  'labels',
  'components',
  'fixVersions',
  'parent',
  'subtasks',
  'created',
  'updated',
  'timetracking',
  'project',
  'creator',
  'watches',
  'attachment',
  'comment',
  'worklog',
  'votes',
  'progress',
  'aggregateprogress',
  'versions',
  'issuelinks',
  'environment',
  'lastViewed',
  'resolution',
  'resolutiondate',
  'duedate',
  'timeoriginalestimate',
  'timeestimate',
  'timespent',
]);

@Injectable()
export class JiraService {
  private readonly logger = new Logger(JiraService.name);
  private readonly client: AxiosInstance | null;
  private readonly host: string | undefined;

  constructor(private readonly config: ConfigService) {
    this.host = this.normalizeHost(this.config.get<string>('JIRA_HOST'));
    const email = this.config.get<string>('JIRA_EMAIL');
    const token = this.config.get<string>('JIRA_API_TOKEN');

    if (this.host && email && token) {
      this.client = axios.create({
        baseURL: `${this.host}/rest`,
        auth: { username: email, password: token },
        headers: { Accept: 'application/json' },
        timeout: 30_000,
      });
    } else {
      this.client = null;
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async listBoards(startAt = 0, maxResults = 50): Promise<JiraBoardListResponse> {
    const { data } = await this.requireClient().get<JiraBoardListResponse>(
      '/agile/1.0/board',
      { params: { startAt, maxResults } },
    );
    return data;
  }

  async listAllBoards(): Promise<JiraBoard[]> {
    const boards: JiraBoard[] = [];
    let startAt = 0;
    const maxResults = 50;
    let isLast = false;

    while (!isLast) {
      const page = await this.listBoards(startAt, maxResults);
      boards.push(...page.values);
      isLast = page.isLast || page.values.length === 0;
      startAt += page.values.length;
    }

    return boards;
  }

  async getProject(projectKey: string): Promise<{
    key: string;
    name: string;
    avatarUrls?: Record<string, string>;
  }> {
    const { data } = await this.requireClient().get<{
      key: string;
      name: string;
      avatarUrls?: Record<string, string>;
    }>(`/api/3/project/${encodeURIComponent(projectKey)}`);
    return data;
  }

  async getBoard(boardId: number): Promise<JiraBoard> {
    const { data } = await this.requireClient().get<JiraBoard>(
      `/agile/1.0/board/${boardId}`,
    );
    return data;
  }

  async getBoardIssues(
    boardId: number,
    options: {
      startAt?: number;
      maxResults?: number;
      /** When true, only issues whose statusCategory is not Done */
      activeOnly?: boolean;
      jql?: string;
    } = {},
  ): Promise<JiraBoardIssuesResponse> {
    const maxResults = options.maxResults ?? 100;
    const startAt = options.startAt ?? 0;
    const jqlParts: string[] = [];

    if (options.activeOnly) {
      jqlParts.push('statusCategory != Done');
    }
    if (options.jql?.trim()) {
      jqlParts.push(`(${options.jql.trim()})`);
    }

    const jql = jqlParts.length > 0 ? jqlParts.join(' AND ') : undefined;
    const allIssues: JiraIssue[] = [];
    let currentStart = startAt;
    let total = 0;

    do {
      const { data } = await this.requireClient().get<JiraBoardIssuesResponse>(
        `/agile/1.0/board/${boardId}/issue`,
        {
          params: {
            startAt: currentStart,
            maxResults,
            expand: 'changelog,names,renderedFields',
            fields: '*all',
            ...(jql ? { jql } : {}),
          },
        },
      );

      allIssues.push(...data.issues);
      total = data.total;
      currentStart += data.issues.length;
    } while (currentStart < total && allIssues.length < total);

    return {
      issues: allIssues,
      total,
      startAt,
      maxResults,
    };
  }

  async getIssue(keyOrId: string): Promise<JiraIssue> {
    const { data } = await this.requireClient().get<JiraIssue>(
      `/api/3/issue/${encodeURIComponent(keyOrId)}`,
      {
        params: {
          expand: 'changelog,names,renderedFields',
          fields: '*all',
        },
      },
    );
    return data;
  }

  async searchIssues(
    jql: string,
    startAt = 0,
    maxResults = 100,
  ): Promise<JiraSearchResponse> {
    const { data } = await this.requireClient().get<JiraSearchResponse>(
      '/api/3/search',
      {
        params: {
          jql,
          startAt,
          maxResults,
          fields: '*all',
          expand: 'changelog,names,renderedFields',
        },
      },
    );
    return data;
  }

  async updateIssueFields(
    keyOrId: string,
    fields: Record<string, unknown>,
  ): Promise<void> {
    await this.requireClient().put(`/api/3/issue/${encodeURIComponent(keyOrId)}`, {
      fields,
    });
  }

  async transitionIssue(
    keyOrId: string,
    transitionId: string,
  ): Promise<void> {
    await this.requireClient().post(
      `/api/3/issue/${encodeURIComponent(keyOrId)}/transitions`,
      { transition: { id: transitionId } },
    );
  }

  async getTransitions(keyOrId: string): Promise<
    Array<{ id: string; name: string; to: { name: string } }>
  > {
    const { data } = await this.requireClient().get<{
      transitions: Array<{ id: string; name: string; to: { name: string } }>;
    }>(`/api/3/issue/${encodeURIComponent(keyOrId)}/transitions`);
    return data.transitions;
  }

  mapIssueToRecord(issue: JiraIssue, boardId?: string): IssueRecordData {
    const fields = issue.fields ?? {};
    const description = this.extractDescription(fields.description);
    const sprint = this.extractSprint(fields);
    const storyPoints = this.extractStoryPoints(fields);
    const timetracking = fields.timetracking ?? {};
    const customFields = this.extractCustomFields(fields);

    return {
      jiraKey: issue.key,
      jiraId: issue.id,
      boardId: boardId ?? null,
      summary: fields.summary ?? issue.key,
      description,
      issueType: fields.issuetype?.name ?? null,
      status: fields.status?.name ?? null,
      statusCategory: fields.status?.statusCategory?.name ?? null,
      priority: fields.priority?.name ?? null,
      assignee: fields.assignee?.displayName ?? null,
      assigneeAccountId: fields.assignee?.accountId ?? null,
      reporter: fields.reporter?.displayName ?? null,
      sprint,
      storyPoints,
      originalEstimateSeconds: timetracking.originalEstimateSeconds ?? null,
      remainingEstimateSeconds: timetracking.remainingEstimateSeconds ?? null,
      timeSpentSeconds: timetracking.timeSpentSeconds ?? null,
      labels: fields.labels ?? [],
      components: (fields.components ?? []).map((c) => c.name ?? '').filter(Boolean),
      fixVersions: (fields.fixVersions ?? [])
        .map((v) => v.name ?? '')
        .filter(Boolean),
      browseUrl: this.host ? `${this.host}/browse/${issue.key}` : issue.self ?? null,
      parentKey: fields.parent?.key ?? null,
      subtasks: fields.subtasks ?? [],
      customFields,
      raw: issue,
      jiraCreatedAt: fields.created ? new Date(fields.created) : null,
      jiraUpdatedAt: fields.updated ? new Date(fields.updated) : null,
    };
  }

  private requireClient(): AxiosInstance {
    if (!this.client) {
      throw new Error('Jira is not configured');
    }
    return this.client;
  }

  private normalizeHost(host?: string): string | undefined {
    if (!host) {
      return undefined;
    }
    return host.replace(/\/$/, '');
  }

  private extractDescription(
    description: JiraIssueFields['description'],
  ): string | null {
    if (!description) {
      return null;
    }
    if (typeof description === 'string') {
      return description;
    }
    return JSON.stringify(description);
  }

  private extractSprint(fields: JiraIssueFields): string | null {
    const sprintField = fields.customfield_10020;
    if (!sprintField) {
      return null;
    }
    if (Array.isArray(sprintField)) {
      const active = sprintField[sprintField.length - 1] as JiraSprint | undefined;
      return active?.name ?? null;
    }
    return (sprintField as JiraSprint).name ?? null;
  }

  private extractStoryPoints(fields: JiraIssueFields): number | null {
    const candidates = [
      fields.customfield_10016,
      fields.story_points,
      fields.storyPoints,
    ];

    for (const value of candidates) {
      if (typeof value === 'number') {
        return value;
      }
    }

    for (const [key, value] of Object.entries(fields)) {
      if (
        key.startsWith('customfield_') &&
        typeof value === 'number' &&
        key !== 'customfield_10020'
      ) {
        return value;
      }
    }

    return null;
  }

  private extractCustomFields(fields: JiraIssueFields): Record<string, unknown> {
    const custom: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (key.startsWith('customfield_') || !STANDARD_FIELD_KEYS.has(key)) {
        custom[key] = value;
      }
    }
    return custom;
  }
}
