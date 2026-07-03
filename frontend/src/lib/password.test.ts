import { describe, expect, it } from 'vitest';
import { getPasswordError, passwordSchema } from './password';

describe('passwordSchema', () => {
  it.each([
    ['short1!', 'lowercase letter'],
    ['alllowercase1!', 'uppercase letter'],
    ['ALLUPPERCASE1!', 'lowercase letter'],
    ['NoNumbers!!', 'number'],
    ['NoSymbols123', 'symbol'],
  ])('rejects %s', (password) => {
    expect(passwordSchema.safeParse(password).success).toBe(false);
  });

  it('accepts a password meeting every requirement', () => {
    expect(passwordSchema.safeParse('Password123!').success).toBe(true);
  });
});

describe('getPasswordError', () => {
  it('returns null for a valid password', () => {
    expect(getPasswordError('Password123!')).toBeNull();
  });

  it('returns a message for an invalid password', () => {
    expect(getPasswordError('weak')).not.toBeNull();
  });
});
