import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: { user: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock } };
  let jwtService: { sign: jest.Mock };

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
    prisma = { user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() } };
    jwtService = { sign: jest.fn().mockReturnValue('signed-token') };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
  });

  describe('register', () => {
    it('throws ConflictException when the email is already in use', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);

      await expect(
        authService.register({ email: baseUser.email, name: 'Jane', password: 'secret123' }),
      ).rejects.toThrow(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('hashes the password and strips it from the returned user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(baseUser);

      const result = await authService.register({
        email: baseUser.email,
        name: 'Jane',
        password: 'secret123',
      });

      const createArgs = prisma.user.create.mock.calls[0][0];
      expect(createArgs.data.password).not.toBe('secret123');
      expect(await bcrypt.compare('secret123', createArgs.data.password)).toBe(true);
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('validateUser', () => {
    it('throws UnauthorizedException when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.validateUser(baseUser.email, 'secret123')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when the user is inactive', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...baseUser, isActive: false });

      await expect(authService.validateUser(baseUser.email, 'secret123')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when the password does not match', async () => {
      const hashed = await bcrypt.hash('secret123', 10);
      prisma.user.findUnique.mockResolvedValue({ ...baseUser, password: hashed });

      await expect(authService.validateUser(baseUser.email, 'wrong-password')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('returns the user without the password when credentials are valid', async () => {
      const hashed = await bcrypt.hash('secret123', 10);
      prisma.user.findUnique.mockResolvedValue({ ...baseUser, password: hashed });

      const result = await authService.validateUser(baseUser.email, 'secret123');

      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe(baseUser.email);
    });
  });

  describe('login', () => {
    it('signs a JWT payload built from the user', () => {
      const { password: _password, ...userWithoutPassword } = baseUser;

      const tokens = authService.login(userWithoutPassword);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: baseUser.id,
        email: baseUser.email,
        role: baseUser.role,
      });
      expect(tokens).toEqual({ accessToken: 'signed-token' });
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.findById(baseUser.id)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the user is inactive', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...baseUser, isActive: false });

      await expect(authService.findById(baseUser.id)).rejects.toThrow(NotFoundException);
    });

    it('returns the user without the password', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);

      const result = await authService.findById(baseUser.id);

      expect(result).not.toHaveProperty('password');
      expect(result.id).toBe(baseUser.id);
    });
  });

  describe('updateProfile', () => {
    it('updates only the name', async () => {
      prisma.user.update.mockResolvedValue({ ...baseUser, name: 'New Name' });

      const result = await authService.updateProfile(baseUser.id, { name: 'New Name' });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: baseUser.id },
        data: { name: 'New Name' },
      });
      expect(result).not.toHaveProperty('password');
      expect(result.name).toBe('New Name');
    });

    it('does not touch email or password', async () => {
      prisma.user.update.mockResolvedValue(baseUser);

      await authService.updateProfile(baseUser.id, {});

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: baseUser.id },
        data: {},
      });
    });
  });

  describe('changePassword', () => {
    it('throws NotFoundException when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.changePassword(baseUser.id, {
          currentPassword: 'secret123',
          newPassword: 'new-secret123',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when the current password is incorrect', async () => {
      const hashed = await bcrypt.hash('secret123', 10);
      prisma.user.findUnique.mockResolvedValue({ ...baseUser, password: hashed });

      await expect(
        authService.changePassword(baseUser.id, {
          currentPassword: 'wrong-password',
          newPassword: 'new-secret123',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('hashes and saves the new password when the current password is correct', async () => {
      const hashed = await bcrypt.hash('secret123', 10);
      prisma.user.findUnique.mockResolvedValue({ ...baseUser, password: hashed });
      prisma.user.update.mockResolvedValue(baseUser);

      await authService.changePassword(baseUser.id, {
        currentPassword: 'secret123',
        newPassword: 'new-secret123',
      });

      const updateArgs = prisma.user.update.mock.calls[0][0];
      expect(updateArgs.data.password).not.toBe('new-secret123');
      expect(await bcrypt.compare('new-secret123', updateArgs.data.password)).toBe(true);
    });
  });
});
