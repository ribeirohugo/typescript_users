import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    register: jest.Mock;
    login: jest.Mock;
    updateProfile: jest.Mock;
    changePassword: jest.Mock;
  };

  const user = {
    id: 'user-1',
    email: 'jane@example.com',
    name: 'Jane',
    role: 'USER' as const,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = moduleRef.get(AuthController);
  });

  it('register delegates to AuthService.register', async () => {
    const dto = { email: 'jane@example.com', password: 'secret123' };
    authService.register.mockResolvedValue(user);

    const result = await controller.register(dto);

    expect(authService.register).toHaveBeenCalledWith(dto);
    expect(result).toBe(user);
  });

  it('login delegates to AuthService.login with the request user', () => {
    authService.login.mockReturnValue({ accessToken: 'token' });

    const result = controller.login({ user }, { email: user.email, password: 'secret123' });

    expect(authService.login).toHaveBeenCalledWith(user);
    expect(result).toEqual({ accessToken: 'token' });
  });

  it('profile returns the request user', () => {
    expect(controller.profile({ user })).toBe(user);
  });

  it('updateProfile delegates to AuthService.updateProfile', async () => {
    authService.updateProfile.mockResolvedValue({ ...user, name: 'New Name' });

    const result = await controller.updateProfile({ user }, { name: 'New Name' });

    expect(authService.updateProfile).toHaveBeenCalledWith(user.id, { name: 'New Name' });
    expect(result).toEqual({ ...user, name: 'New Name' });
  });

  it('changePassword delegates to AuthService.changePassword', async () => {
    const dto = { currentPassword: 'secret123', newPassword: 'new-secret123' };
    authService.changePassword.mockResolvedValue(user);

    const result = await controller.changePassword({ user }, dto);

    expect(authService.changePassword).toHaveBeenCalledWith(user.id, dto);
    expect(result).toBe(user);
  });
});
