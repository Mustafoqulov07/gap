import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export const UserId = createParamDecorator(
  (key: string | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();

    const userId = req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException('Foydalanuvchi topilmadi');
    }

    return Number(userId);
  },
);

export const UserRole = createParamDecorator(
  (key: string | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();

    const role = req.user?.role;

    if (!role) {
      throw new UnauthorizedException('Foydalanuvchi topilmadi');
    }

    return role;
  },
);
