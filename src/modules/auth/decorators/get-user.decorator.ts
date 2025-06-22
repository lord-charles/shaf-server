import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserDocument } from '../schemas/user.schema';

/**
 * Custom decorator to extract the user object from the request.
 * Assumes that a guard (e.g., JwtAuthGuard) has already validated the
 * request and attached the user object.
 *
 * @example
 * ```
 * @Get('profile')
 * getProfile(@GetUser() user: UserDocument) {
 *   return user;
 * }
 * ```
 */
export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserDocument => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
