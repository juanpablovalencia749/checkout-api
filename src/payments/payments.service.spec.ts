import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { ExternalApiService } from '../external-api/external-api.service';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prismaMock: any;
  let apiMock: any;

  beforeEach(async () => {
    prismaMock = {
      transaction: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      product: {
        update: jest.fn(),
      },
      delivery: {
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    apiMock = {
      getIntegrityKey: jest.fn().mockReturnValue('secret'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ExternalApiService, useValue: apiMock },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyWebhookSignature', () => {
    it('returns true for a valid signature', () => {
      const body = {
        signature: {
          properties: ['a', 'b'],
          checksum: '',
        },
        a: 'foo',
        b: 'bar',
      };
      // construct correct checksum
      const integrity = 'secret';
      const str = 'foo' + 'bar' + integrity;
      const hash = require('crypto').createHash('sha256').update(str).digest('hex');
      body.signature.checksum = hash;

      expect(service.verifyWebhookSignature(body)).toBe(true);
    });

    it('returns false for invalid signature', () => {
      const body = {
        signature: { properties: ['x'], checksum: 'bad' },
        x: 'value',
      };
      expect(service.verifyWebhookSignature(body)).toBe(false);
    });
  });

  describe('handleTransactionUpdated', () => {
    it('throws when reference missing', async () => {
      await expect(service.handleTransactionUpdated({} as any)).rejects.toThrow(InternalServerErrorException);
    });
  });
});