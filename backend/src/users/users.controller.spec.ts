import { Test } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  const user = { id: 'user-1', email: 'jane@example.com', role: 'USER' };

  beforeEach(async () => {
    usersService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    controller = moduleRef.get(UsersController);
  });

  it('create delegates to UsersService.create', async () => {
    const dto = { email: 'jane@example.com', password: 'secret123' };
    usersService.create.mockResolvedValue(user);

    const result = await controller.create(dto);

    expect(usersService.create).toHaveBeenCalledWith(dto);
    expect(result).toBe(user);
  });

  it('findAll delegates to UsersService.findAll', async () => {
    usersService.findAll.mockResolvedValue([user]);

    const result = await controller.findAll();

    expect(usersService.findAll).toHaveBeenCalled();
    expect(result).toEqual([user]);
  });

  it('findOne delegates to UsersService.findOne', async () => {
    usersService.findOne.mockResolvedValue(user);

    const result = await controller.findOne(user.id);

    expect(usersService.findOne).toHaveBeenCalledWith(user.id);
    expect(result).toBe(user);
  });

  it('update delegates to UsersService.update', async () => {
    const dto = { name: 'New Name' };
    usersService.update.mockResolvedValue({ ...user, name: 'New Name' });

    const result = await controller.update(user.id, dto);

    expect(usersService.update).toHaveBeenCalledWith(user.id, dto);
    expect(result).toEqual({ ...user, name: 'New Name' });
  });

  it('remove delegates to UsersService.remove', async () => {
    usersService.remove.mockResolvedValue(undefined);

    await controller.remove(user.id);

    expect(usersService.remove).toHaveBeenCalledWith(user.id);
  });
});
