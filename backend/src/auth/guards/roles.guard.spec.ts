import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: { getAllAndOverride: jest.Mock };

  function contextWithUser(role: string): ExecutionContext {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role } }),
      }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('allows access when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(contextWithUser('USER'))).toBe(true);
  });

  it('allows access when the required roles list is empty', () => {
    reflector.getAllAndOverride.mockReturnValue([]);

    expect(guard.canActivate(contextWithUser('USER'))).toBe(true);
  });

  it('allows access when the user has one of the required roles', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);

    expect(guard.canActivate(contextWithUser('ADMIN'))).toBe(true);
  });

  it('denies access when the user does not have a required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);

    expect(guard.canActivate(contextWithUser('USER'))).toBe(false);
  });
});
