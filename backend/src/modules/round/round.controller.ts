import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../common/guard/jwt-auth.guard';
import { RoundService } from './round.service';
import {
  UserId,
  UserRole,
} from '../../common/decorator/current-user.decorator';
import { Roles } from '../../common/enum';

@UseGuards(AuthGuard)
@Controller('round')
export class RoundController {
  constructor(private readonly roundService: RoundService) { }

  @Post('gap/:gapId')
  createRounds(
    @UserId() userId: number,
    @Param('gapId', ParseIntPipe) gapId: number,
  ) {
    return this.roundService.createRounds(userId, gapId);
  }

  @Get('gap/:gapId')
  findByGap(
    @UserId() userId: number,
    @UserRole() role: Roles,
    @Param('gapId', ParseIntPipe) gapId: number,
  ) {
    return this.roundService.findByGap(userId, role, gapId);
  }

  @Get('active/:gapId')
  findActive(
    @UserId() userId: number,
    @UserRole() role: Roles,
    @Param('gapId', ParseIntPipe) gapId: number,
  ) {
    return this.roundService.findActive( userId, role, gapId );
  }

  @Get(':id')
  findOne(
    @UserId() userId: number,
    @UserRole() role: Roles,
    @Param('id', ParseIntPipe) roundId: number,
  ) {
    return this.roundService.findOne(userId, role, roundId);
  }
}
