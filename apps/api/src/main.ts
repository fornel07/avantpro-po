import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RealtimeService } from './realtime/realtime.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const webOrigin = config.get<string>('WEB_ORIGIN', 'http://localhost:5173');

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: [webOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = Number(config.get<string>('PORT', '3001'));
  await app.listen(port, '0.0.0.0');

  const realtime = app.get(RealtimeService);
  realtime.attach(app.getHttpServer());

  console.log(`API listening on http://localhost:${port}/api`);
  console.log(`WebSocket: http://localhost:${port}/socket.io`);
  console.log(`Jira webhook: http://localhost:${port}/api/v1/webhooks/jira`);
}
bootstrap();
