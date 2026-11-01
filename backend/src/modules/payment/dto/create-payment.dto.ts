import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  roundId!: number;

  @ApiPropertyOptional({
    example: 500000,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  amount?: number;
}