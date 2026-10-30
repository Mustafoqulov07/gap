import { PartialType } from '@nestjs/swagger';
import { CreateGapDto } from './create-gap.dto';

export class UpdateGapDto extends PartialType(CreateGapDto) {}
