import { Test, TestingModule } from '@nestjs/testing';
import { SlackService } from './slack.service';
import { ConfigService } from '@nestjs/config';

describe('SlackService', () => {
  let service: SlackService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlackService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(
              () => 'https://hooks.slack.com/services/test/webhook/url',
            ),
          },
        },
      ],
    }).compile();

    service = module.get<SlackService>(SlackService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
