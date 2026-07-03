import { z } from 'zod';

export const PASSWORD_HINT =
  'Min. 8 characters, with an uppercase letter, a lowercase letter, a number, and a symbol';

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[0-9]/, 'Password must include a number')
  .regex(/[^A-Za-z0-9]/, 'Password must include a symbol');

export function getPasswordError(password: string): string | null {
  const result = passwordSchema.safeParse(password);
  return result.success ? null : result.error.issues[0].message;
}
