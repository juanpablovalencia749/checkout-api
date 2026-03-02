import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { BadRequestException } from '@nestjs/common';
import { of } from 'rxjs';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: PaymentsService;

  const mockPaymentsService = {
    verifyWebhookSignature: jest.fn(),
    handleTransactionUpdated: jest.fn(),
    getAcceptanceData: jest.fn(),
    subscribeToTransaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    service = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('webhook', () => {
    it('should process transaction.updated event successfully', async () => {
      const body = {
        event: 'transaction.updated',
        data: { id: '123' },
      };

      mockPaymentsService.handleTransactionUpdated.mockResolvedValue(true);

      const result = await controller.webhook(body);

      expect(service.handleTransactionUpdated).toHaveBeenCalledWith(body.data);
      expect(result).toEqual({ success: true });
    });

    it('should return success:false if event is missing', async () => {
      const result = await controller.webhook({});
      expect(result).toEqual({ success: false });
    });

    it('should return success true for unhandled event', async () => {
      const body = {
        event: 'transaction.created',
      };

      const result = await controller.webhook(body);

      expect(result).toEqual({ success: true });
    });
  });

  describe('acceptanceData', () => {
    it('should return acceptance data', async () => {
      const mockData = { acceptance_token: 'abc123' };

      mockPaymentsService.getAcceptanceData.mockResolvedValue(mockData);

      const result = await controller.acceptanceData();

      expect(service.getAcceptanceData).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        data: mockData,
      });
    });
  });

  describe('sse', () => {
    it('should return an observable for transaction events', () => {
      const transactionId = 'tx_123';
      const mockObservable = of({ data: { status: 'APPROVED' } });

      mockPaymentsService.subscribeToTransaction.mockReturnValue(
        mockObservable,
      );

      const result = controller.sse(transactionId);

      expect(service.subscribeToTransaction).toHaveBeenCalledWith(
        transactionId,
      );
      expect(result).toBe(mockObservable);
    });
  });
});