import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DeviceController } from './device.controller';
import { DeviceService } from './device.service';
import { OtpService } from '../../infrastructure/otp/otp.service';

@Module({
  controllers: [AuthController, DeviceController],
  providers: [AuthService, DeviceService, OtpService],
})
export class AuthModule {}
