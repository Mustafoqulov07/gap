import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    example: '+998901234567',
  })
  @IsPhoneNumber('UZ')
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/, {
    message: 'OTP kodi 6 xonali bo‘lishi kerak',
  })
  code!: string;

  @ApiPropertyOptional({
    example: 'newPassword123',
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  newPassword?: string;
}