import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeEmail } from '../common/normalize-email';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const email = normalizeEmail(dto.email);
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email already in use');

    const hashed = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: { ...dto, email, password: hashed },
    });

    return this.exclude(user);
  }

  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return users.map((u) => this.exclude(u));
  }

  async findOne(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return this.exclude(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<Omit<User, 'password'>> {
    await this.findOne(id);

    const data: Partial<User> = { ...dto };
    if (dto.email) {
      data.email = normalizeEmail(dto.email);
    }
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, SALT_ROUNDS);
    }

    const updated = await this.prisma.user.update({ where: { id }, data });
    return this.exclude(updated);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.user.update({ where: { id }, data: { isActive: false } });
  }

  private exclude(user: User): Omit<User, 'password'> {
    const { password: _, ...rest } = user;
    return rest;
  }
}
