import {
  ApiPropertyOptional,
} from '@nestjs/swagger';

import {
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUrl,
} from 'class-validator';

export class UserUpdateDto {
  @ApiPropertyOptional({
    example: 'Eshmat Toshmatov',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  fullName?: string;

  @ApiPropertyOptional({
    example: '+998901234567',
  })
  @IsOptional()
  @IsPhoneNumber('UZ')
  @IsNotEmpty()
  phone?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsUrl()
  avatar?: string;
}