import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { successRes } from '../../common/helper/success-response';
import { Token } from '../../infrastructure/lib/Token';
import { PrismaService } from '../../config/prisma/prisma.service';

@Injectable()
export class DeviceService {
  constructor(private readonly db: PrismaService) {}

  async findAll(userId: number) {
    const devices = await this.db.device.findMany({
      where: { userId },
      select: {
        id: true,
        device: true,
        createdAt: true,
      },
    });

    return successRes(devices);
  }

  async remove(userId: number, refreshToken: string, id: number) {
    const verifiedData = await Token.verifyToken(refreshToken, 'refresh');

    const iatDate = new Date(verifiedData.iat * 1000);
    const diffInMinutes = Math.floor(
      (Date.now() - iatDate.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) {
      throw new BadRequestException(
        "Eski qurilmani o'chirish uchun 24 soat talab etiladi",
      );
    }

    if (verifiedData.deviceId === id) {
      throw new BadRequestException("Joriy qurilmani o'chirib bo'lmaydi");
    }

    const device = await this.db.device.findFirst({ where: { id, userId } });

    if (!device) {
      throw new NotFoundException('Qurilma topilmadi');
    }

    await this.db.device.delete({ where: { id } });

    return successRes({});
  }
}
