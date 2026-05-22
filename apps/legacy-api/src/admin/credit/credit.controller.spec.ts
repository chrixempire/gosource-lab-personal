import { Test, TestingModule } from '@nestjs/testing';
import { CreditController } from './credit.controller';
import { CreditService } from './credit.service';
import { CreditRepaymentService } from '../../credit-repayment/credit-repayment.service';
import { AuthGuard } from '../../auth/auth.guard';

describe('CreditController', () => {
  let controller: CreditController;

  const mockCreditService = () => ({
    getCredits: jest.fn(),
    getCreditRequests: jest.fn(),
    rejectRequest: jest.fn(),
    getAllRepayments: jest.fn(),
    getCreditRequestStats: jest.fn(),
    getCreditRequest: jest.fn(),
    rejectApplication: jest.fn(),
    approveCredit: jest.fn(),
    getSingleCredit: jest.fn(),
    deleteCreditApplication: jest.fn(),
    deleteCreditAccount: jest.fn(),
    createInternalNote: jest.fn(),
    getInternalNotes: jest.fn(),
    updateInternalNote: jest.fn(),
    deleteInternalNote: jest.fn(),
    getInternalNotesStats: jest.fn(),
    approveCreditRequestWithRepayment: jest.fn(),
    getRepaymentSchedule: jest.fn(),
    processRepayment: jest.fn(),
    getOverdueRepayments: jest.fn(),
    addAdditionalApplicationDoc: jest.fn(),
    deleteAdditionalDoc: jest.fn(),
    initialiseApplicationCheckist: jest.fn(),
    getApplicationChecklist: jest.fn(),
    updateApplicationChecklist: jest.fn(),
    deleteApplicationChecklist: jest.fn(),
  });

  const mockRepaymentService = () => ({
    approveBankTransferPayment: jest.fn(),
  });

  const mockAuthGuard = { canActivate: () => true };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreditController],
      providers: [
        { provide: CreditService, useValue: mockCreditService() },
        { provide: CreditRepaymentService, useValue: mockRepaymentService() },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<CreditController>(CreditController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
