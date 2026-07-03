import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let usersService: UsersService;
  let prisma: {
    user: { findUnique: jest.Mock; findMany: jest.Mock; create: jest.Mock; update: jest.Mock };
  };

  const baseUser = {
    id: 'user-1',
    email: 'jane@example.com',
    name: 'Jane',
    password: 'hashed-password',
    role: 'USER' as const,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    usersService = moduleRef.get(UsersService);
  });

  describe('create', () => {
    it('throws ConflictException when the email is already in use', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);

      await expect(
        usersService.create({ email: baseUser.email, password: 'secret123' }),
      ).rejects.toThrow(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('hashes the password and strips it from the returned user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(baseUser);

      const result = await usersService.create({
        email: baseUser.email,
        password: 'secret123',
      });

      const createArgs = prisma.user.create.mock.calls[0][0];
      expect(createArgs.data.password).not.toBe('secret123');
      expect(await bcrypt.compare('secret123', createArgs.data.password)).toBe(true);
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('findAll', () => {
    it('returns all users without their password', async () => {
      prisma.user.findMany.mockResolvedValue([baseUser]);

      const result = await usersService.findAll();

      expect(prisma.user.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: 'desc' } });
      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('password');
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(usersService.findOne(baseUser.id)).rejects.toThrow(NotFoundException);
    });

    it('returns the user without the password', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);

      const result = await usersService.findOne(baseUser.id);

      expect(result).not.toHaveProperty('password');
      expect(result.id).toBe(baseUser.id);
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(usersService.update(baseUser.id, { name: 'New Name' })).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('hashes the password when one is provided', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.user.update.mockResolvedValue(baseUser);

      await usersService.update(baseUser.id, { password: 'new-secret123' });

      const updateArgs = prisma.user.update.mock.calls[0][0];
      expect(updateArgs.data.password).not.toBe('new-secret123');
      expect(await bcrypt.compare('new-secret123', updateArgs.data.password)).toBe(true);
    });

    it('updates fields as-is when no password is provided', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.user.update.mockResolvedValue({ ...baseUser, name: 'New Name' });

      const result = await usersService.update(baseUser.id, { name: 'New Name' });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: baseUser.id },
        data: { name: 'New Name' },
      });
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(usersService.remove(baseUser.id)).rejects.toThrow(NotFoundException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('soft-deletes the user by setting isActive to false', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.user.update.mockResolvedValue({ ...baseUser, isActive: false });

      await usersService.remove(baseUser.id);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: baseUser.id },
        data: { isActive: false },
      });
    });
  });
});
