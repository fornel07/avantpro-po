export interface JiraUser {
  accountId?: string;
  displayName?: string;
  emailAddress?: string;
}

export interface JiraStatus {
  name?: string;
  statusCategory?: {
    name?: string;
    key?: string;
  };
}

export interface JiraIssueType {
  name?: string;
  subtask?: boolean;
}

export interface JiraPriority {
  name?: string;
}

export interface JiraComponent {
  name?: string;
}

export interface JiraVersion {
  name?: string;
}

export interface JiraSubtask {
  id?: string;
  key?: string;
  fields?: {
    summary?: string;
    status?: JiraStatus;
  };
}

export interface JiraSprint {
  name?: string;
  id?: number;
}

export interface JiraTimeTracking {
  originalEstimateSeconds?: number;
  remainingEstimateSeconds?: number;
  timeSpentSeconds?: number;
}

export interface JiraIssueFields {
  summary?: string;
  description?: string | Record<string, unknown>;
  issuetype?: JiraIssueType;
  status?: JiraStatus;
  priority?: JiraPriority;
  assignee?: JiraUser | null;
  reporter?: JiraUser | null;
  labels?: string[];
  components?: JiraComponent[];
  fixVersions?: JiraVersion[];
  parent?: { key?: string; id?: string };
  subtasks?: JiraSubtask[];
  created?: string;
  updated?: string;
  timetracking?: JiraTimeTracking;
  customfield_10016?: number | null;
  customfield_10020?: JiraSprint[] | JiraSprint | null;
  [key: string]: unknown;
}

export interface JiraIssue {
  id: string;
  key: string;
  self?: string;
  fields: JiraIssueFields;
  names?: Record<string, string>;
  renderedFields?: Record<string, unknown>;
  changelog?: unknown;
}

export interface JiraBoard {
  id: number;
  name: string;
  type?: string;
  location?: {
    projectKey?: string;
    projectName?: string;
  };
}

export interface JiraBoardListResponse {
  values: JiraBoard[];
  maxResults: number;
  startAt: number;
  total: number;
  isLast: boolean;
}

export interface JiraSearchResponse {
  issues: JiraIssue[];
  total: number;
  startAt: number;
  maxResults: number;
}

export interface JiraBoardIssuesResponse {
  issues: JiraIssue[];
  total: number;
  startAt: number;
  maxResults: number;
}

export interface IssueRecordData {
  jiraKey: string;
  jiraId: string;
  boardId?: string | null;
  summary: string;
  description?: string | null;
  issueType?: string | null;
  status?: string | null;
  statusCategory?: string | null;
  priority?: string | null;
  assignee?: string | null;
  assigneeAccountId?: string | null;
  reporter?: string | null;
  sprint?: string | null;
  storyPoints?: number | null;
  originalEstimateSeconds?: number | null;
  remainingEstimateSeconds?: number | null;
  timeSpentSeconds?: number | null;
  labels: string[];
  components: string[];
  fixVersions: string[];
  browseUrl?: string | null;
  parentKey?: string | null;
  subtasks?: unknown;
  customFields?: unknown;
  raw: unknown;
  jiraCreatedAt?: Date | null;
  jiraUpdatedAt?: Date | null;
}
