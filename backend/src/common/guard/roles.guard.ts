import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorator/roles.decorator';
import { Roles } from '../enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user) {
      throw new ForbiddenException('Foydalanuvchi topilmadi');
    }

    if (user.role === Roles.SUPER_ADMIN) {
      return true;
    }

    if (requiredRoles.includes('ID')) {
      const requestedId = Number(req.params?.id);
      const currentUserId = Number(user.sub);

      if (requestedId === currentUserId) {
        return true;
      }

      throw new ForbiddenException('Bu foydalanuvchiga ruxsat yoq');
    }

    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException('Ruxsat etilmagan foydalanuvchi');
    }

    return true;
  }
}
