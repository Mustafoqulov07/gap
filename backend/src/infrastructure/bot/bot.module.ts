import { Global, Module } from '@nestjs/common';
import { TelegramBotService } from './bot.service';

@Global()
@Module({
  providers: [TelegramBotService],
  exports: [TelegramBotService],
})
export class TelegramBotModule {}
