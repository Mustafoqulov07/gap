import { Logger } from '@nestjs/common';
import { env } from '../../config';

export class LoggerBot {
  private static readonly logger = new Logger(LoggerBot.name);

  static async sendMessage(message: string): Promise<void> {
    if (!env.TELEGRAM.TOKEN || !env.TELEGRAM.ID) {
      this.logger.warn('Telegram configuration is missing');
      return;
    }

    const url = `https://api.telegram.org/bot${env.TELEGRAM.TOKEN}/sendMessage`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: env.TELEGRAM.ID,
          text: message,
          parse_mode: 'HTML',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();

        this.logger.error(
          `Telegram API error: ${response.status} ${errorText}`,
        );
      }
    } catch (error) {
      this.logger.error(
        'Failed to send Telegram message',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
