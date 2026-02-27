import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { UnauthorizedException } from '@nestjs/common';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let paymentsService: PaymentsService;

  const mockPaymentsService = {
    verifyWebhookHmac: jest.fn(),
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
    paymentsService = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleWebhook', () => {
    it('should return ok if reference exists', async () => {
      const mockReq = {
        rawBody: JSON.stringify({}),
        body: {
          data: {
            transaction: {
              reference: 'ORDER-123',
            },
          },
        },
      };

      const result = await controller.handleWebhook(
        mockReq,
        'checksum',
        'signature',
      );

      expect(result).toEqual({ status: 'ok' });
    });

    it('should throw UnauthorizedException if reference missing', async () => {
      const mockReq = {
        rawBody: JSON.stringify({}),
        body: {},
      };

      await expect(
        controller.handleWebhook(mockReq, 'checksum', 'signature'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});