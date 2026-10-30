import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateGapDto {
  @ApiProperty({
    example: 'Dostlar gapi',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    example: 'Har oy pul yigish uchun tashkil qilingan gap',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 5,
    minimum: 2,
  })
  @IsInt()
  @Min(2)
  maxMembers!: number;

  @ApiProperty({
    example: 500000,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  monthlyAmount!: number;
}