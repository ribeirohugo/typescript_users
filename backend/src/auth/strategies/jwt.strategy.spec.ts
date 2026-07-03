import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from '../auth.service';

describe('JwtStrategy', () => {
  it('delegates to AuthService.findById using the payload subject', async () => {
    const user = { id: 'user-1', email: 'jane@example.com' };
    const authService = { findById: jest.fn().mockResolvedValue(user) };
    const config = { getOrThrow: jest.fn().mockReturnValue('jwt-secret') };
    const strategy = new JwtStrategy(
      config as unknown as ConfigService,
      authService as unknown as AuthService,
    );

    const result = await strategy.validate({
      sub: 'user-1',
      email: 'jane@example.com',
      role: 'USER',
    });

    expect(authService.findById).toHaveBeenCalledWith('user-1');
    expect(result).toBe(user);
  });
});
