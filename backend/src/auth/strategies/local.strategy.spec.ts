import { LocalStrategy } from './local.strategy';
import { AuthService } from '../auth.service';

describe('LocalStrategy', () => {
  it('delegates to AuthService.validateUser', async () => {
    const user = { id: 'user-1', email: 'jane@example.com' };
    const authService = { validateUser: jest.fn().mockResolvedValue(user) };
    const strategy = new LocalStrategy(authService as unknown as AuthService);

    const result = await strategy.validate('jane@example.com', 'secret123');

    expect(authService.validateUser).toHaveBeenCalledWith('jane@example.com', 'secret123');
    expect(result).toBe(user);
  });
});
