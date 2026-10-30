import { Module } from '@nestjs/common';
import { GapController } from './gap.controller';
import { GapService } from './gap.service';

@Module({
  controllers: [GapController],
  providers: [GapService],
})
export class GapModule {}
