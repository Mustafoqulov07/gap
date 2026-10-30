import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { CreateGapDto } from './dto/create-gap.dto';
import { GapStatus, Roles } from '../../common/enum';
import { successRes } from '../../common/helper/success-response';
import { UpdateGapDto } from './dto/update-gap.dto';

@Injectable()
export class GapService {
  constructor(private readonly db: PrismaService) { }

  async create(userId: number, dto: CreateGapDto) {
    const { name, description, maxMembers, monthlyAmount } = dto;

    return this.db.$transaction(async (tx) => {
      const gap = await tx.gap.create({
        data: {
          name,
          description,
          organizerId: userId,
          maxMembers,
          monthlyAmount,
          duration: 0,
        },
      });

      await tx.gapMember.create({
        data: {
          gapId: gap.id,
          userId,
        },
      });

      return successRes(gap, 201);
    });
  }

  async addMember(organizerId: number, gapId: number, userId: number) {
    const gap = await this.db.gap.findUnique({
      where: { id: gapId },
      include: { members: true },
    });

    if (!gap) {
      throw new NotFoundException('Gap Topilmadi');
    }

    if (gap.organizerId !== organizerId) {
      throw new ForbiddenException('Faqat OWNER azo qosha oladi');
    }

    if (gap.status !== GapStatus.ACTIVE) {
      throw new BadRequestException('Bu gap faol emas');
    }

    if (gap.duration > 0) {
      throw new BadRequestException(
        'Boshlangan gapga yangi azo qoshish mumkin emas',
      );
    }

    const user = await this.db.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilamdi');
    }

    const alreadyMember = gap.members.some((memb) => memb.userId === userId);

    if (alreadyMember) {
      throw new BadRequestException('Foydalanuvchi allaqachon azo');
    }

    if (gap.members.length >= gap.maxMembers) {
      throw new BadRequestException('Gap tolgan');
    }

    const createMember = await this.db.gapMember.create({
      data: {
        gapId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            avatar: true,
          },
        },
      },
    });

    return successRes(createMember, 201);
  }

  async startGap(userId: number, gapId: number) {
    const gap = await this.db.gap.findUnique({
      where: { id: gapId },
      include: { members: true },
    });

    if (!gap) {
      throw new NotFoundException('Gap topilmadi');
    }

    if (gap.organizerId !== userId) {
      throw new ForbiddenException('Faqat OWNER boshlaydi');
    }

    if (gap.status !== GapStatus.ACTIVE) {
      throw new BadRequestException('Bu gapni boshlash mumkun emas');
    }
    if (gap.members.length < 2) {
      throw new BadRequestException(
        'Gapni boshlash uchun kamida 2ta azo bolishi kerak',
      );
    }

    const duration = gap.members.length;

    const updateGap = await this.db.gap.update({
      where: { id: gapId },
      data: { duration },
    });

    return successRes(updateGap, 201);
  }

  async cancel(userId: number, role: Roles, gapId: number) {
    const gap = await this.db.gap.findUnique({ where: { id: gapId } });

    if (!gap) {
      throw new NotFoundException('Gap topilmadi');
    }

    if (role !== Roles.SUPER_ADMIN && gap.organizerId !== userId) {
      throw new ForbiddenException('Faqat OWNER yoki SUPER_ADMIN gapni bekor qila oladi');
    }

    if (gap.status !== GapStatus.ACTIVE) {
      throw new BadRequestException('Bu gapni bekor qilib bolmaydi');
    }

    if (gap.duration > 0) {
      throw new BadRequestException('Boshlangan gapni bekor qilib bolmaydi');
    }

    const cancelledGap = await this.db.gap.update({
      where: { id: gapId }, data: {
        status: GapStatus.CANCELLED,
      },
    });

    return successRes(cancelledGap, 200);
  }

  async findAll(userId: number, role: Roles) {
    const gaps = await this.db.gap.findMany({
      where:
        role === Roles.SUPER_ADMIN ? {} : { members: { some: { userId } } },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return successRes(gaps);
  }

  async update(userId: number, role: Roles, gapId: number, dto: UpdateGapDto) {
    const gap = await this.db.gap.findUnique({ where: { id: gapId } })

    if (!gap) {
      throw new NotFoundException('Gap topilmadi')
    }

    if (role !== Roles.SUPER_ADMIN && gap.organizerId !== userId) {
      throw new ForbiddenException('Faqat OWNER gapni yangilay oladi')
    }

    if (gap.status !== GapStatus.ACTIVE) {
      throw new BadRequestException('Bu gapni yangilab bolmaydi')
    }

    const isStarted = gap.duration > 0;

    if (
      isStarted && (dto.maxMembers !== undefined || dto.monthlyAmount !== undefined)
    ) {
      throw new BadRequestException('Boshlangan gapda maxMembers va monthlyAmountni ozgartirib bolmaydi')
    }

    if (dto.maxMembers !== undefined && dto.maxMembers < 0) {
      throw new BadRequestException('maxMemebers kamida 2 bolishi kerak')
    }

    if (dto.maxMembers !== undefined) {
      const memberCount = await this.db.gapMember.count({
        where: { gapId },
      });

      if (dto.maxMembers < memberCount) {
        throw new BadRequestException('maxMembers mavjud azolar sonidan kam bolishi mumkin emas');
      }
    }

    const updatedGap = await this.db.gap.update({
      where: { id: gapId },
      data: {
        name: dto.name,
        description: dto.description,
        maxMembers: dto.maxMembers,
        monthlyAmount: dto.monthlyAmount,
      }
    });

    return successRes(updatedGap)
  }

  async findOne(userId: number, role: Roles, gapId: number) {
    const gap = await this.db.gap.findUnique({
      where: { id: gapId },
      include: {
        organizer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!gap) {
      throw new NotFoundException('Gap topilmadi');
    }

    if (role !== Roles.SUPER_ADMIN) {
      const isMember = gap.members.some((memb) => memb.userId === userId);

      if (!isMember) {
        throw new ForbiddenException('Bu gapni korishga ruxsat yoq');
      }
    }

    return successRes(gap);
  }


  async removeMember(currentUserId: number, role: Roles, gapId: number, memberId: number) {
    const gap = await this.db.gap.findUnique({ where: { id: gapId } });

    if (!gap) {
      throw new NotFoundException('Gap topilmadi');
    }

    if (
      role !== Roles.SUPER_ADMIN &&
      gap.organizerId !== currentUserId
    ) {
      throw new ForbiddenException(
        'Faqat OWNER yoki SUPER_ADMIN azo chiqara oladi',
      );
    }

    if (gap.status !== GapStatus.ACTIVE) {
      throw new BadRequestException('Bu gap faol emas');
    }

    if (gap.duration > 0) {
      throw new BadRequestException('Boshlangan gapdan azo chiqarib bolmaydi');
    }

    if (gap.organizerId === memberId) {
      throw new BadRequestException('OWNERni gapdan chiqarib bolmaydi');
    }

    const member = await this.db.gapMember.findUnique({
      where: { gapId_userId: { gapId, userId: memberId } },
    });

    if (!member) {
      throw new NotFoundException('Bu foydalanuvchi gap azo emas');
    }

    await this.db.gapMember.delete({
      where: { id: member.id },
    });

    return successRes({ message: 'Azo gapdan chiqarildi' }, 200);
  }

  async remove(userId: number, role: Roles, gapId: number) {
    const gap = await this.db.gap.findUnique({ where: { id: gapId } });

    if (!gap) {
      throw new NotFoundException('Gap topilmadi');
    }

    if (
      role !== Roles.SUPER_ADMIN &&
      gap.organizerId !== userId
    ) {
      throw new ForbiddenException('Faqat OWNER yoki SUPER_ADMIN gapni ochira oladi');
    }

    if (gap.duration > 0) {
      throw new BadRequestException('Boshlangan gapni ochirib bolmaydi');
    }

    if (gap.status !== GapStatus.ACTIVE) {
      throw new BadRequestException('Bu gapni ochirib bolmaydi');
    }

    await this.db.gap.delete({ where: { id: gapId } });

    return successRes({ message: 'Gap ochirildi' }, 200);
  }
}
