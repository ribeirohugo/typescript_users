import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsStrongPassword } from '../../common/is-strong-password.decorator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  password!: string;

  @IsString()
  @IsOptional()
  name?: string;
}
