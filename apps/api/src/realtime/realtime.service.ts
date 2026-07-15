import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Server as HttpServer } from 'node:http';
import { Server, Socket } from 'socket.io';
import { RedisService } from '../redis/redis.service';
import { RealtimeEnvelope, RealtimeEventType } from '../redis/redis.constants';

@Injectable()
export class RealtimeService implements OnModuleDestroy {
  private readonly logger = new Logger(RealtimeService.name);
  private server: Server | null = null;

  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  attach(httpServer: HttpServer): void {
    if (this.server) {
      return;
    }

    const webOrigin = this.config.get<string>(
      'WEB_ORIGIN',
      'http://localhost:5173',
    );

    this.server = new Server(httpServer, {
      path: '/socket.io',
      cors: {
        origin: [webOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.server.on('connection', (client: Socket) => {
      this.logger.log(`Client connected: ${client.id}`);
      client.emit('connection.status', {
        type: 'connection.status',
        payload: {
          connected: true,
          redis: this.redis.isConnected(),
        },
        timestamp: new Date().toISOString(),
      } satisfies RealtimeEnvelope);
    });

    this.redis.onMessage((envelope) => {
      this.server?.emit(envelope.type, envelope);
    });

    this.logger.log('Socket.IO attached on /socket.io');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server?.close(() => resolve());
      });
      this.server = null;
    }
  }

  async emitIssueCreated(payload: unknown): Promise<void> {
    await this.emit('issue.created', payload);
  }

  async emitIssueUpdated(payload: unknown): Promise<void> {
    await this.emit('issue.updated', payload);
  }

  async emitIssueDeleted(payload: unknown): Promise<void> {
    await this.emit('issue.deleted', payload);
  }

  async emitSyncCompleted(payload: unknown): Promise<void> {
    await this.emit('sync.completed', payload);
  }

  private async emit(type: RealtimeEventType, payload: unknown): Promise<void> {
    const envelope: RealtimeEnvelope = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    };
    this.server?.emit(type, envelope);
    await this.redis.publish(type, payload);
  }
}
