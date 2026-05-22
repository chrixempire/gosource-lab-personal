import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SystemConfigService } from '../system-config.service';
import { SystemConfig } from '../schema/systemConfig.schema';

describe('SystemConfigService', () => {
  let service: SystemConfigService;
  let model: any;

  beforeEach(async () => {
    const mockModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      deleteOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemConfigService,
        {
          provide: getModelToken(SystemConfig.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<SystemConfigService>(SystemConfigService);
    model = module.get(getModelToken(SystemConfig.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should fetch all configs', async () => {
    const mockConfigs = [{ key: 'test', value: 'value' }];
    model.find.mockReturnValue(mockConfigs);

    const response = await service.getConfigs();
    expect(response.status).toBe(true);
    expect(response.data).toEqual(mockConfigs);
  });

  it('should get config by key', async () => {
    const mockConfig = { key: 'test', value: 'value' };
    model.findOne.mockReturnValue(mockConfig);

    const response = await service.getConfigByKey('test');
    expect(response).toEqual(mockConfig);
  });

  it('should update config', async () => {
    const mockConfig = { key: 'test', value: 'newValue' };
    model.findOneAndUpdate.mockReturnValue(mockConfig);

    const response = await service.updateConfig('test', 'newValue', 'desc');
    expect(response.status).toBe(true);
    expect(response.data).toEqual(mockConfig);
  });
});
