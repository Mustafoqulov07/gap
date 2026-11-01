import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Bot } from 'grammy';
import { env } from '../../config';
import { RedisService } from '../../config/redis/redis.service';

@Injectable()
export class TelegramBotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramBotService.name);
  private bot?: Bot;

  constructor(private readonly redisService: RedisService) {}

  async onModuleInit() {
    if (!env.TELEGRAM.TOKEN) {
      this.logger.warn('TELEGRAM_BOT_TOKEN kiritilmagan');
      return;
    }

    try {
      this.bot = new Bot(env.TELEGRAM.TOKEN);

      // Start komandasi: chat_id ni saqlaymiz va kutilayotgan OTP bo'lsa darhol yuboramiz
      this.bot.command('start', async (ctx) => {
        const chatId = String(ctx.chat.id);
        const redis = this.redisService.client;

        await redis.sadd('bot:subscribers', chatId);

        await ctx.reply(
          `👋 Salom, <b>${ctx.from?.first_name ?? 'foydalanuvchi'}</b>!\n\n` +
            `Siz <b>GapPay</b> botiga ulandingiz. Barcha tasdiqlash kodlari shu yerga yuboriladi.`,
          { parse_mode: 'HTML' },
        );

        // Agar start bosishdan oldin so'ralgan OTP mavjud bo'lsa, uni darhol yuboramiz
        const latestOtp = await redis.get('bot:latest_otp');
        if (latestOtp) {
          await ctx.reply(
            `Oxirgi so‘ralgan tasdiqlash kodingiz:\n\n${latestOtp}`,
            { parse_mode: 'HTML' },
          );
        }
      });

      // Pollingni xatoliklarga chidamli qilib ishga tushiramiz
      this.bot
        .start({
          onStart: (botInfo) => {
            this.logger.log(`Telegram Bot @${botInfo.username} polling rejimida ishga tushdi`);
          },
        })
        .catch((err) => {
          this.logger.error('Telegram bot polling xatosi:', err);
        });
    } catch (error) {
      this.logger.error('Telegram botni ishga tushirishda xatolik:', error);
    }
  }

  async sendOtp(phone: string, code: string, ttlSeconds: number): Promise<void> {
    const minutes = Math.max(1, Math.round(ttlSeconds / 60));
    const message =
      `🔐 <b>GapPay Tasdiqlash Kodi</b>\n\n` +
      `📞 <b>Telefon:</b> <code>${phone}</code>\n` +
      `🔢 <b>Kodingiz:</b> <code>${code}</code>\n` +
      `⏳ <b>Amal qilish muddati:</b> ${minutes} daqiqa`;

    const redis = this.redisService.client;

    // 1. Oxirgi OTP ni Redisda saqlaymiz (agar foydalanuvchi start bosmagan bo'lsa, keyinroq start bosganda olishi uchun)
    await redis.set('bot:latest_otp', message, 'EX', ttlSeconds);
    await redis.set(`bot:otp:${phone}`, message, 'EX', ttlSeconds);

    // 2. Qabul qiluvchilar ro'yxatini yig'amiz
    const targetChatIds = new Set<string>();

    if (env.TELEGRAM.ID) {
      targetChatIds.add(String(env.TELEGRAM.ID));
    }

    try {
      const subscribers = await redis.smembers('bot:subscribers');
      for (const sub of subscribers) {
        targetChatIds.add(sub);
      }
    } catch {
      // redis xatosi bo'lsa e'tiborsiz qoldiramiz
    }

    if (this.bot && targetChatIds.size > 0) {
      for (const chatId of targetChatIds) {
        try {
          await this.bot.api.sendMessage(chatId, message, {
            parse_mode: 'HTML',
          });
        } catch (err: any) {
          this.logger.warn(`Chat ${chatId} ga xabar yuborib bo'lmadi: ${err.message}`);
        }
      }
    }
  }

  async onModuleDestroy() {
    if (this.bot) {
      await this.bot.stop();
    }
  }
}
