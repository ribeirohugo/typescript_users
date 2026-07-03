import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from './register.dto';

describe('RegisterDto', () => {
  it.each(['short1!', 'alllowercase1!', 'ALLUPPERCASE1!', 'NoNumbers!!', 'NoSymbols123'])(
    'rejects a weak password (%s)',
    async (password) => {
      const dto = plainToInstance(RegisterDto, {
        email: 'jane@example.com',
        password,
      });

      const errors = await validate(dto);

      expect(errors.some((e) => e.property === 'password')).toBe(true);
    },
  );

  it('accepts a strong password with a valid email', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: 'jane@example.com',
      password: 'Password123!',
      name: 'Jane',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects an invalid email regardless of password strength', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: 'not-an-email',
      password: 'Password123!',
    });

    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });
});
