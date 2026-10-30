import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { successRes } from '../../common/helper/success-response';
import { Roles, RoundStatus } from '../../common/enum';

@Injectable()
export class RoundService {
  constructor(private readonly db: PrismaService) { }

  async createRounds(userId: number, gapId: number) {
    const gap = await this.db.gap.findUnique({
      where: { id: gapId },
      include: {
        members: true,
      },
    });

    if (!gap) {
      throw new NotFoundException('Gap topilmadi');
    }

    if (gap.organizerId !== userId) {
      throw new ForbiddenException('Faqat OWNER raund yarata oladi');
    }

    if (gap.duration !== gap.members.length) {
      throw new BadRequestException('Gap hali boshlanmagan');
    }

    if (gap.members.length < 2) {
      throw new BadRequestException(
        'Raund ochilishi uchun kamida 2ta azo bolishi kerak',
      );
    }

    const existingRound = await this.db.round.count({
      where: { id: gapId },
    });

    if (existingRound > 0) {
      throw new BadRequestException('Bu gap uchun raund yaratilgan');
    }

    const members = [...gap.members];

    for (let i = members.length - 1; i > 0; i--) {
      const x = Math.floor(Math.random() * (i + 1));
      [members[i], members[x]] = [members[x], members[i]];
    }

    const rounds = await this.db.$transaction(
      members.map((member, index) =>
        this.db.round.create({
          data: {
            gapId,
            roundNumber: index + 1,
            receiverId: member.userId,
            status: index === 0 ? RoundStatus.ACTIVE : RoundStatus.PENDING,
          },
        }),
      ),
    );

    return successRes(rounds, 201);
  }

  async findByGap(userId: number, role: Roles, gapId: number) {
    const gap = await this.db.gap.findUnique({
      where: { id: gapId },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!gap) {
      throw new NotFoundException('Gap topilmadi');
    }

    if (role !== Roles.SUPER_ADMIN && gap.members.length === 0) {
      throw new ForbiddenException('Bu gapdagi roundlarni korishga ruxsat yoq');
    }

    const rounds = await this.db.round.findMany({
      where: { gapId },
      include: {
        receiver: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            avatar: true,
          },
        },
      },
      orderBy: { roundNumber: 'asc' },
    });

    return successRes(rounds);
  }

  async findActive( userId: number, role: Roles, gapId: number ) {
    const gap = await this.db.gap.findUnique({
      where: { id: gapId }, include: {
        members: { where: { userId } },
      },
    });

    if (!gap) {
      throw new NotFoundException('Gap topilmadi');
    }

    if (
      role !== Roles.SUPER_ADMIN &&
      gap.members.length === 0
    ) {
      throw new ForbiddenException('Bu gapdagi roundni korishga ruxsat yoq');
    }

    const round = await this.db.round.findFirst({
      where: { gapId, status: RoundStatus.ACTIVE },
      include: {
        receiver: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            avatar: true,
          },
        },
      },
    });

    if (!round) {
      throw new NotFoundException('Hozir faol round mavjud emas');
    }

    return successRes(round, 200);
  }

  async findOne(userId: number, role: Roles, roundId: number) {
    const round = await this.db.round.findUnique({
      where: {
        id: roundId,
      },
      include: {
        receiver: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            avatar: true,
          },
        },
        gap: {
          include: {
            members: {
              where: {
                userId,
              },
            },
          },
        },
      },
    });

    if (!round) {
      throw new NotFoundException('Round topilmadi');
    }

    if (role !== Roles.SUPER_ADMIN && round.gap.members.length === 0) {
      throw new ForbiddenException('Bu roundni korishga ruxsat yoq');
    }

    const { members, ...gap } = round.gap;

    return successRes({ ...round, gap });
  }


}
