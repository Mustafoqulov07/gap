import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PrismaService } from '../../config/prisma/prisma.service';
import { GapStatus, PaymentStatus, Roles, RoundStatus } from '../../common/enum';
import { successRes } from '../../common/helper/success-response';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) { }

  async create(userId: number, dto: CreatePaymentDto) {
    const { roundId } = dto;

    const round = await this.prisma.round.findUnique({
      where: { id: roundId },
      include: { gap: { include: { members: true } } },
    });

    if (!round) {
      throw new NotFoundException('Round topilmadi');
    }

    if (round.status !== RoundStatus.ACTIVE) {
      throw new BadRequestException('Faqat ACTIVE round uchun payment yaratish mumkin');
    }

    if (round.gap.status !== GapStatus.ACTIVE) {
      throw new BadRequestException('Bu gap faol emas');
    }

    if (round.receiverId === userId) {
      throw new BadRequestException('Receiver oz roundida payment qilmaydi');
    }

    const member = await this.prisma.gapMember.findUnique({ where: { gapId_userId: { gapId: round.gapId, userId } } });

    if (!member) {
      throw new ForbiddenException('User ushbu Gap azosi emas');
    }

    const existingPayment = await this.prisma.payment.findUnique({ where: { roundId_userId: { roundId, userId } } });
    if (existingPayment) {
      throw new ConflictException('Bu user ushbu round uchun tolov qilgan');
    }

    const payment = await this.prisma.payment.create({
      data: {
        roundId,
        userId,
        amount: round.gap.monthlyAmount,
      },
    });

    return successRes(payment, 201);
  }

  async pay(userId: number, paymentId: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        round: {
          include: {
            gap: {
              include: {
                members: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment topilmadi');
    }

    // Authorization: Only receiver can confirm/pay the payment
    if (payment.round.receiverId !== userId) {
      throw new ForbiddenException('Faqat pul oluvchi to\'lovni tasdiqlashi mumkin');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Bu to\'lov allaqachon tasdiqlangan');
    }

    const result = await this.prisma.$transaction(
      async (tx) => {
        const updatedPayment = await tx.payment.update({
          where: {
            id: paymentId,
          },
          data: {
            status: PaymentStatus.PAID,
            paidAt: new Date(),
          },
        });

        const requiredPayments = payment.round.gap.members.filter(
          (member) => member.userId !== payment.round.receiverId,
        ).length;

        const paidPayments = await tx.payment.count({
          where: {
            roundId: payment.roundId,
            status: PaymentStatus.PAID,
          },
        });

        if (paidPayments === requiredPayments) {
          await tx.round.update({
            where: {
              id: payment.roundId,
            },
            data: {
              status: RoundStatus.COMPLETED,
              completedAt: new Date(),
            },
          });

          const nextRound = await tx.round.findFirst({
            where: {
              gapId: payment.round.gapId,
              roundNumber: payment.round.roundNumber + 1,
              status: RoundStatus.PENDING,
            },
          });

          if (nextRound) {
            await tx.round.update({
              where: {
                id: nextRound.id,
              },
              data: {
                status: RoundStatus.ACTIVE,
                startedAt: new Date(),
              },
            });
          } else {
            await tx.gap.update({
              where: {
                id: payment.round.gapId,
              },
              data: {
                status: GapStatus.COMPLETED,
              },
            });
          }
        }

        return updatedPayment;
      },
    );
    return successRes(result);
  }

  async findAll(userId: number) {
    const payments = await this.prisma.payment.findMany({
      where: { userId },
      include: {
        round: {
          select: {
            id: true,
            roundNumber: true,
            status: true,
            receiver: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                avatar: true,
              },
            },
            gap: {
              select: {
                id: true,
                name: true,
                monthlyAmount: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successRes(payments, 200);
  }

  async findOne(userId: number, role: Roles, paymentId: number) {
    const payment = await this.prisma.payment.findUnique({
      where: {
        id: paymentId,
      },
      include: {
        round: {
          select: {
            id: true,
            roundNumber: true,
            status: true,
            receiver: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                avatar: true,
              },
            },
            gap: {
              select: {
                id: true,
                name: true,
                monthlyAmount: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment topilmadi');
    }

    if (role !== Roles.SUPER_ADMIN && payment.userId !== userId && payment.round.receiver.id !== userId) {
      throw new ForbiddenException('Bu paymentni korishga ruxsat yoq');
    }
    return successRes(payment, 200);
  }

  async findByRound(userId: number, role: Roles, roundId: number) {
    const round = await this.prisma.round.findUnique({
      where: { id: roundId },
      include: {
        gap: {
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
        },
      },
    });

    if (!round) {
      throw new NotFoundException('Round topilmadi');
    }

    const isMember = round.gap.members.some((m) => m.userId === userId);

    if (role !== Roles.SUPER_ADMIN && !isMember) {
      throw new ForbiddenException('Bu rounddagi paymentlarni korishga ruxsat yoq');
    }

    // Auto-ensure PENDING payment records exist for all non-receiver members of the round
    const nonReceiverMembers = round.gap.members.filter((m) => m.userId !== round.receiverId);

    for (const member of nonReceiverMembers) {
      const existing = await this.prisma.payment.findUnique({
        where: { roundId_userId: { roundId, userId: member.userId } },
      });

      if (!existing) {
        await this.prisma.payment.create({
          data: {
            roundId,
            userId: member.userId,
            amount: round.gap.monthlyAmount,
            status: PaymentStatus.PENDING,
          },
        });
      }
    }

    const payments = await this.prisma.payment.findMany({
      where: { roundId },
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
      orderBy: {
        createdAt: 'asc',
      },
    });

    return successRes(payments, 200);
  }
}