import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Token } from '../../infrastructure/lib/Token';
import { Roles, Status } from '../enum';
import { PrismaService } from '../../config/prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly db: PrismaService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      throw new UnauthorizedException('Tizimga kirishda nosozlik');
    }

    const data = await Token.verifyToken(accessToken, 'access');

    if (
      !data ||
      typeof data.sub !== 'number' ||
      !Object.values(Roles).includes(data.role) ||
      !Object.values(Status).includes(data.status) ||
      typeof data.deviceId !== 'number'
    ) {
      throw new UnauthorizedException('Tizimga kirishda nosozlik');
    }

    const user = await this.db.user.findUnique({
      where: { id: data.sub },
      select: { status: true },
    });

    if (!user || user.status === Status.INACTIVE) {
      throw new UnauthorizedException('Foydalanuvchi faol emas');
    }

    req.user = {
      sub: data.sub,
      role: data.role,
      status: user.status,
      deviceId: data.deviceId,
    };

    return true;
  }
}
