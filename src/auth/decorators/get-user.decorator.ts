import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';

/**
 * Custom decorator to extract the user from the request object
 * Can be used in controllers to get the current authenticated user
 * 
 * Usage: @GetUser() user: User
 * 
 * @param data Optional property name to extract from the user object
 * @param ctx Execution context
 * @returns The user object or a specific property of the user
 */
export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: User = request.user;

    // If data is provided, return the specific property
    if (data) {
      return user?.[data];
    }

    // Otherwise return the whole user object
    return user;
  },
);