import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ChangePasswordDto } from './change-password.dto';

describe('ChangePasswordDto', () => {
  it.each(['short1!', 'alllowercase1!', 'ALLUPPERCASE1!', 'NoNumbers!!', 'NoSymbols123'])(
    'rejects a weak new password (%s)',
    async (newPassword) => {
      const dto = plainToInstance(ChangePasswordDto, {
        currentPassword: 'whatever-the-current-password-is',
        newPassword,
      });

      const errors = await validate(dto);

      expect(errors.some((e) => e.property === 'newPassword')).toBe(true);
    },
  );

  it('accepts a strong new password', async () => {
    const dto = plainToInstance(ChangePasswordDto, {
      currentPassword: 'whatever-the-current-password-is',
      newPassword: 'Password123!',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('does not require the current password to be "strong"', async () => {
    const dto = plainToInstance(ChangePasswordDto, {
      currentPassword: 'weak',
      newPassword: 'Password123!',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });
});
