import { Body, Controller, Headers, Post } from '@nestjs/common';
import type { JiraWebhookPayload } from './webhooks.service';
import { WebhooksService } from './webhooks.service';

@Controller('v1/webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('jira')
  async handleJiraWebhook(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() payload: JiraWebhookPayload,
  ) {
    this.webhooksService.validateSecret(headers);
    return this.webhooksService.handleJiraWebhook(payload);
  }
}
