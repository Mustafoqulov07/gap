import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { successRes } from '../../common/helper/success-response';
import { UserUpdateDto } from './dto/user-update.dto';
import { File } from '../../infrastructure/lib/File';
import type { Response } from 'express';
import { Token } from '../../infrastructure/lib/Token';
import { Status } from '../../../generated/prisma/enums';
import { GapStatus } from '../../common/enum';

@Injectable()
export class UserService {
  constructor(private readonly db: PrismaService) { }

  async findAll() {
    const users = await this.db.user.findMany({
      select: {
        id: true,
        fullName: true,
        phone: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        id: 'asc',
      },
    });

    return successRes(users);
  }

  async findOne(id: number) {
    const user = await this.db.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        phone: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    return successRes(user);
  }

  async update(id: number, dto: UserUpdateDto, avatar?: Express.Multer.File) {
    const user = await this.db.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    if (dto.phone && dto.phone !== user.phone) {
      const existsPhone = await this.db.user.findUnique({
        where: { phone: dto.phone },
      });

      if (existsPhone) {
        throw new ConflictException('Bunday telefon raqam allaqachon mavjud');
      }
    }

    let avatarUrl = user.avatar;

    if (avatar) {
      if (avatarUrl && (await File.exist(avatarUrl))) {
        await File.delete(avatarUrl);
      }

      avatarUrl = await File.create(avatar);
    }

    const update = await this.db.user.update({
      where: { id },
      data: {
        ...dto,
        avatar: avatarUrl,
      },
      omit: { password: true },
    });

    return successRes({
      data: update,
    });
  }

  async remove(id: number, currentUserId: number, res: Response) {
    const user = await this.db.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    const activeGaps = await this.db.gap.count({
    where: {
    status: GapStatus.ACTIVE,
    OR: [
      { organizerId: id },
      {
        members: {
          some: {
            userId: id,
          },
        },
      },
    ],
  },
});

if (activeGaps > 0) {
  throw new BadRequestException(
    'Siz faol gapda qatnashyapsiz. Avval faol gaplardan chiqishingiz kerak.',
  );
}

    if (user.avatar && (await File.exist(user.avatar))) {
      await File.delete(user.avatar);
    }

    await this.db.user.delete({
      where: { id },
    });

    if (currentUserId === id) {
      Token.clearCookie(res);
    }

    return successRes({
      message: 'Foydalanuvchi muvaffaqiyatli ochirildi',
    });
  }

  async updateStatus(id: number, status: Status) {
    const user = await this.db.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    const updatedUser = await this.db.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
      },
    });

    return successRes(updatedUser);
  }
}
