import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface HealthMetrics {
  status: 'ok';
  issuesTotal: number;
  doneIssues: number;
  averageLeadTimeDays: number | null;
  bugCount: number;
  featureCount: number;
  bugFeatureRatio: number | null;
}

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealthMetrics(): Promise<HealthMetrics> {
    const issues = await this.prisma.issue.findMany({
      select: {
        issueType: true,
        statusCategory: true,
        jiraCreatedAt: true,
        updatedAt: true,
      },
    });

    const doneIssues = issues.filter(
      (issue) =>
        issue.statusCategory?.toLowerCase() === 'done' ||
        issue.statusCategory?.toLowerCase() === 'complete',
    );

    const leadTimes = doneIssues
      .filter((issue) => issue.jiraCreatedAt)
      .map((issue) => {
        const start = issue.jiraCreatedAt!.getTime();
        const end = issue.updatedAt.getTime();
        return (end - start) / (1000 * 60 * 60 * 24);
      });

    const averageLeadTimeDays =
      leadTimes.length > 0
        ? leadTimes.reduce((sum, value) => sum + value, 0) / leadTimes.length
        : null;

    const bugCount = issues.filter((issue) =>
      (issue.issueType ?? '').toLowerCase().includes('bug'),
    ).length;

    const featureCount = issues.filter((issue) => {
      const type = (issue.issueType ?? '').toLowerCase();
      return (
        type.includes('story') ||
        type.includes('feature') ||
        type.includes('improvement') ||
        type.includes('epic')
      );
    }).length;

    const bugFeatureRatio =
      featureCount > 0 ? Number((bugCount / featureCount).toFixed(2)) : null;

    return {
      status: 'ok',
      issuesTotal: issues.length,
      doneIssues: doneIssues.length,
      averageLeadTimeDays:
        averageLeadTimeDays !== null
          ? Number(averageLeadTimeDays.toFixed(2))
          : null,
      bugCount,
      featureCount,
      bugFeatureRatio,
    };
  }
}
