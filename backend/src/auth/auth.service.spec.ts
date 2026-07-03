import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: { user: { findUnique: jest.Mock; create: jest.Mock } };
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
    prisma = { user: { findUnique: jest.fn(), create: jest.fn() } };
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
});
