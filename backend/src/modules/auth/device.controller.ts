import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';

import { DeviceService } from './device.service';

import { AuthGuard } from '../../common/guard/jwt-auth.guard';
import { RolesGuard } from '../../common/guard/roles.guard';

import { UserId } from '../../common/decorator/current-user.decorator';
import { RefreshToken } from '../../common/decorator/get-cookie.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Controller('device')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Get()
  findAll(@UserId() userId: number) {
    return this.deviceService.findAll(userId);
  }

  @Delete(':id')
  remove(
    @UserId() userId: number,
    @RefreshToken() refreshToken: string,
    @Param('id', ParseIntPipe) deviceId: number,
  ) {
    return this.deviceService.remove(userId, refreshToken, deviceId);
  }
}
