import { Test, TestingModule } from '@nestjs/testing';
import { CreditService } from './credit.service';
import { getModelToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Credit } from '../../credit/schema/credit.schema';
import { CreditRequest } from '../../credit/schema/creditRequest';
import { CreditInternalNote } from '../../credit/schema/creditInternalNote.schema';
import { RepaymentSchedule } from '../../credit/schema/repaymentSchedule.schema';
import { CreditDocumentChecklist } from '../../credit/schema/creditDocumentChecklist.schema';
import { CreditAccount } from '../../credit/schema/creditAccount.schema';
import { S3Service } from '../../cloudinary/s3.service';

describe('CreditService', () => {
  let service: CreditService;

  const mockModel = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
  });

  const mockS3Service = () => ({
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  });

  const mockConnection = () => ({
    startSession: jest.fn().mockReturnValue({
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    }),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreditService,
        { provide: getModelToken(Credit.name), useValue: mockModel() },
        { provide: getModelToken(CreditRequest.name), useValue: mockModel() },
        {
          provide: getModelToken(CreditInternalNote.name),
          useValue: mockModel(),
        },
        {
          provide: getModelToken(RepaymentSchedule.name),
          useValue: mockModel(),
        },
        {
          provide: getModelToken(CreditDocumentChecklist.name),
          useValue: mockModel(),
        },
        { provide: getModelToken(CreditAccount.name), useValue: mockModel() },
        { provide: S3Service, useValue: mockS3Service() },
        { provide: 'DatabaseConnection', useValue: mockConnection() }, // Mocking InjectConnection
        { provide: 'mongooseConnection', useValue: mockConnection() },
        { provide: Connection, useValue: mockConnection() },
      ],
    }).compile();

    service = module.get<CreditService>(CreditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
