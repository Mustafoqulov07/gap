import { Module } from '@nestjs/common';
import { RoundController } from './round.controller';
import { RoundService } from './round.service';

@Module({
  controllers: [RoundController],
  providers: [RoundService],
})
export class RoundModule {}
