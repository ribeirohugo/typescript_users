import { IsStrongPassword as IsStrongPasswordBase, ValidationOptions } from 'class-validator';

export const PASSWORD_REQUIREMENTS_MESSAGE =
  'password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a symbol';

export function IsStrongPassword(validationOptions?: ValidationOptions): PropertyDecorator {
  return IsStrongPasswordBase(
    { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 },
    { message: PASSWORD_REQUIREMENTS_MESSAGE, ...validationOptions },
  );
}
