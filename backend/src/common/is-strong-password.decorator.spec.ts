import { validate } from 'class-validator';
import { IsStrongPassword } from './is-strong-password.decorator';

class Dto {
  @IsStrongPassword()
  password: string;

  constructor(password: string) {
    this.password = password;
  }
}

describe('IsStrongPassword', () => {
  it.each([
    ['short1!', 'too short'],
    ['alllowercase1!', 'missing uppercase'],
    ['ALLUPPERCASE1!', 'missing lowercase'],
    ['NoNumbers!!', 'missing a number'],
    ['NoSymbols123', 'missing a symbol'],
  ])('rejects %s (%s)', async (password) => {
    const errors = await validate(new Dto(password));

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('isStrongPassword');
  });

  it('accepts a password meeting every requirement', async () => {
    const errors = await validate(new Dto('Password123!'));

    expect(errors).toHaveLength(0);
  });
});
