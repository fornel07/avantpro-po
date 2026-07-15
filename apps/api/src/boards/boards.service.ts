import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Board } from '@prisma/client';
import { JiraService } from '../jira/jira.service';
import { PrismaService } from '../prisma/prisma.service';
import { SyncService } from '../sync/sync.service';
import { CreateBoardDto } from './dto/board.dto';

@Injectable()
export class BoardsService {
  private readonly logger = new Logger(BoardsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jira: JiraService,
    private readonly sync: SyncService,
  ) {}

  async findAll(): Promise<Board[]> {
    return this.prisma.board.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { issues: true } } },
    });
  }

  async findOne(id: string): Promise<Board> {
    const board = await this.prisma.board.findUnique({
      where: { id },
      include: { _count: { select: { issues: true } } },
    });
    if (!board) {
      throw new NotFoundException(`Board ${id} not found`);
    }
    return board;
  }

  async create(dto: CreateBoardDto): Promise<Board> {
    const board = await this.upsertFromJiraBoardId(dto.jiraBoardId);
    await this.sync.syncBoard(board.id, {
      activeOnly: true,
      sustentacaoOnly: true,
    });
    return this.findOne(board.id);
  }

  async importAllFromJira() {
    if (!this.jira.isConfigured()) {
      throw new BadRequestException('Jira is not configured');
    }

    const remoteBoards = await this.jira.listAllBoards();
    this.logger.log(`Importing ${remoteBoards.length} boards from Jira...`);

    const imported: Board[] = [];
    for (const remote of remoteBoards) {
      try {
        const board = await this.upsertFromJiraBoardId(remote.id);
        imported.push(board);
      } catch (error) {
        this.logger.error(
          `Failed to import board ${remote.id} (${remote.name}): ${String(error)}`,
        );
      }
    }

    const syncResults = await this.sync.syncAllConfiguredBoards({
      activeOnly: true,
      sustentacaoOnly: true,
    });

    return {
      imported: imported.length,
      synced: syncResults.length,
      issuesSynced: syncResults.reduce((sum, r) => sum + r.issuesSynced, 0),
      boards: await this.findAll(),
    };
  }

  async syncAll() {
    if (!this.jira.isConfigured()) {
      throw new BadRequestException('Jira is not configured');
    }
    const results = await this.sync.syncAllConfiguredBoards({
      activeOnly: true,
      sustentacaoOnly: true,
    });
    return {
      synced: results.length,
      issuesSynced: results.reduce((sum, r) => sum + r.issuesSynced, 0),
      results,
    };
  }

  async remove(id: string): Promise<Board> {
    await this.findOne(id);
    return this.prisma.board.delete({ where: { id } });
  }

  async syncBoard(id: string) {
    return this.sync.syncBoard(id, {
      activeOnly: true,
      sustentacaoOnly: true,
    });
  }

  private async upsertFromJiraBoardId(jiraBoardId: number): Promise<Board> {
    if (!this.jira.isConfigured()) {
      throw new BadRequestException('Jira is not configured');
    }

    const jiraBoard = await this.jira.getBoard(jiraBoardId);
    const projectKey = jiraBoard.location?.projectKey ?? 'UNKNOWN';
    let projectName = jiraBoard.location?.projectName ?? null;
    let avatarUrl: string | null = null;

    try {
      const project = await this.jira.getProject(projectKey);
      projectName = project.name ?? projectName;
      avatarUrl =
        project.avatarUrls?.['48x48'] ??
        project.avatarUrls?.['32x32'] ??
        null;
    } catch {
      // optional enrichment
    }

    return this.prisma.board.upsert({
      where: { jiraBoardId },
      update: {
        name: jiraBoard.name,
        projectKey,
        projectName,
        avatarUrl,
        type: jiraBoard.type ?? null,
      },
      create: {
        jiraBoardId,
        name: jiraBoard.name,
        projectKey,
        projectName,
        avatarUrl,
        type: jiraBoard.type ?? null,
      },
    });
  }
}
