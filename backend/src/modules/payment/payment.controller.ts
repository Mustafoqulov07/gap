import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentService } from './payment.service';
import { UserId, UserRole } from '../../common/decorator/current-user.decorator';
import { AuthGuard } from '../../common/guard/jwt-auth.guard';
import { Roles } from '../../common/enum';

@UseGuards(AuthGuard)
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
  ) { }

  @Post()
  create(
    @Body() dto: CreatePaymentDto,
    @UserId() userId: number,
  ) {
    return this.paymentService.create(userId, dto);
  }

  @Patch(':id/pay')
  pay(
    @Param('id', ParseIntPipe) paymentId: number,
    @UserId() userId: number,
  ) {
    return this.paymentService.pay(userId, paymentId);
  }

  @Get(':id')
  findOne(
    @UserId() userId: number,
    @UserRole() role: Roles,
    @Param('id', ParseIntPipe) paymentId: number,
  ) {
    return this.paymentService.findOne(userId, role, paymentId);
  }

  @Get('round/:roundId')
  findByRound(
    @UserId() userId: number,
    @UserRole() role: Roles,
    @Param('roundId', ParseIntPipe) roundId: number,
  ) {
    return this.paymentService.findByRound( userId, role, roundId );
  }
}