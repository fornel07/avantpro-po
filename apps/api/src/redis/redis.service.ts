import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import {
  REALTIME_CHANNEL,
  RealtimeEnvelope,
  RealtimeEventType,
} from './redis.constants';

type MessageHandler = (envelope: RealtimeEnvelope) => void;

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private publisher!: Redis;
  private subscriber!: Redis;
  private readonly handlers = new Set<MessageHandler>();
  private connected = false;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const url = this.config.get<string>('REDIS_URL', 'redis://localhost:6379');
    this.publisher = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 3 });
    this.subscriber = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 3 });

    try {
      await this.publisher.connect();
      await this.subscriber.connect();
      this.connected = true;
      this.logger.log('Redis connected');

      await this.subscriber.subscribe(REALTIME_CHANNEL);
      this.subscriber.on('message', (_channel, message) => {
        try {
          const envelope = JSON.parse(message) as RealtimeEnvelope;
          for (const handler of this.handlers) {
            handler(envelope);
          }
        } catch (error) {
          this.logger.warn(`Failed to parse redis message: ${String(error)}`);
        }
      });
    } catch (error) {
      this.logger.warn(
        `Redis unavailable, realtime pub/sub disabled: ${String(error)}`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.subscriber) {
      await this.subscriber.quit().catch(() => undefined);
    }
    if (this.publisher) {
      await this.publisher.quit().catch(() => undefined);
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  onMessage(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  async publish<T>(
    type: RealtimeEventType,
    payload: T,
  ): Promise<void> {
    if (!this.connected) {
      return;
    }

    const envelope: RealtimeEnvelope<T> = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    };

    await this.publisher.publish(REALTIME_CHANNEL, JSON.stringify(envelope));
  }
}
