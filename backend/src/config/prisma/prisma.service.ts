import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../../generated/prisma/client';
import { env } from '../index';
import { Crypt } from '../../infrastructure/lib/Crypt';
import { Roles } from '../../common/enum';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const adapter = new PrismaPg({
      connectionString: env.DB_URL,
    });

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();

    this.logger.log('Database connected');

    const superAdmin = await this.user.findUnique({
      where: {
        phone: env.SUPERADMIN.PHONE,
      },
    });

    if (!superAdmin) {
      const hashedPassword = await Crypt.hash(env.SUPERADMIN.PASSWORD);

      await this.user.create({
        data: {
          fullName: 'Super Admin',
          phone: env.SUPERADMIN.PHONE,
          password: hashedPassword,
          role: Roles.SUPER_ADMIN,
        },
      });

      this.logger.log('Super Admin created');
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
