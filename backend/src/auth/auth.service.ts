import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtPayload } from './strategies/jwt.strategy';

export interface AuthTokens {
  accessToken: string;
}

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<Omit<User, 'password'>> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const hashed = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: { ...dto, password: hashed },
    });

    return this.exclude(user);
  }

  async validateUser(email: string, password: string): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    return this.exclude(user);
  }

  login(user: Omit<User, 'password'>): AuthTokens {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    return { accessToken: this.jwtService.sign(payload) };
  }

  async findById(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || !user.isActive) throw new NotFoundException('User not found');
    return this.exclude(user);
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<Omit<User, 'password'>> {
    const data: Partial<User> = {};

    if (dto.name !== undefined) data.name = dto.name;

    if (dto.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing && existing.id !== id) throw new ConflictException('Email already in use');
      data.email = dto.email;
    }

    if (dto.password) {
      if (!dto.currentPassword)
        throw new BadRequestException('Current password is required to set a new password');

      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) throw new NotFoundException('User not found');

      const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
      if (!isMatch) throw new BadRequestException('Current password is incorrect');

      data.password = await bcrypt.hash(dto.password, SALT_ROUNDS);
    }

    const updated = await this.prisma.user.update({ where: { id }, data });
    return this.exclude(updated);
  }

  private exclude(user: User): Omit<User, 'password'> {
    const { password: _, ...rest } = user;
    return rest;
  }
}
