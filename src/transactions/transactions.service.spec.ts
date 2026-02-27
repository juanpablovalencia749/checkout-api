import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { NotFoundException, BadRequestException, ConflictException, InternalServerErrorException } from '@nestjs/common';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prismaMock: any;
  let paymentsMock: any;

  beforeEach(async () => {
    // Mock Prisma minimal shape used by the service
    prismaMock = {
      product: {
        findUnique: jest.fn(),
      },
      customer: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      transaction: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      delivery: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    // payments mock
    paymentsMock = {
      createPaymentOnProvider: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: PaymentsService, useValue: paymentsMock },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates transaction when product exists and stock ok and customer not found', async () => {
      const dto = {
        productId: 'p1',
        quantity: 1,
        amount: 1500,
        customerEmail: 'a@b.com',
        customerFullName: 'Juan',
        customerPhone: '3001112222',
      };

      const product = { id: 'p1', stock: 10 };
      prismaMock.product.findUnique.mockResolvedValue(product);
      prismaMock.customer.findUnique.mockResolvedValue(null);
      prismaMock.customer.create.mockResolvedValue({ id: 'c1', email: dto.customerEmail });
      prismaMock.transaction.create.mockResolvedValue({ id: 'tx1', ...dto, status: 'PENDING' });

      const tx = await service.create(dto as any);

      expect(prismaMock.product.findUnique).toHaveBeenCalledWith({ where: { id: dto.productId } });
      expect(prismaMock.customer.create).toHaveBeenCalled();
      expect(prismaMock.transaction.create).toHaveBeenCalled();
      expect(tx).toHaveProperty('id', 'tx1');
    });

    it('throws if product not found', async () => {
      prismaMock.product.findUnique.mockResolvedValue(null);
      await expect(service.create({ productId: 'no' } as any)).rejects.toThrow(NotFoundException);
    });

    it('throws if not enough stock', async () => {
      prismaMock.product.findUnique.mockResolvedValue({ id: 'p1', stock: 0 });
      await expect(service.create({ productId: 'p1', quantity: 1 } as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll & findOne', () => {
    it('findAll returns list', async () => {
      const data = [{ id: 'tx1' }, { id: 'tx2' }];
      prismaMock.transaction.findMany.mockResolvedValue(data);
      const res = await service.findAll();
      expect(res).toBe(data);
      expect(prismaMock.transaction.findMany).toHaveBeenCalled();
    });

    it('findOne returns item or throws', async () => {
      prismaMock.transaction.findUnique.mockResolvedValue({ id: 'tx1' });
      const ok = await service.findOne('tx1');
      expect(ok).toHaveProperty('id', 'tx1');

      prismaMock.transaction.findUnique.mockResolvedValue(null);
      await expect(service.findOne('no')).rejects.toThrow(NotFoundException);
    });
  });

  describe('processPayment', () => {
    const transactionRecord = {
      id: 'tx1',
      amount: 1500,
      productId: 'p1',
      quantity: 1,
      status: 'PENDING',
      customer: { id: 'c1', email: 'a@b.com' },
      product: { id: 'p1', stock: 5 },
    };

    it('processPayment completes flow when provider approves', async () => {
      // findUnique returns transaction with included product & customer
      prismaMock.transaction.findUnique.mockResolvedValue(transactionRecord);
      // provider returns approved
      paymentsMock.createPaymentOnProvider.mockResolvedValue({
        data: { data: { id: 'prov1', status: 'APPROVED' } },
      });

      // prisma.update used twice: one to update transaction after provider call, then $transaction will update stock and create delivery
      prismaMock.transaction.update.mockResolvedValue({});
      // $transaction should call its callback - we simulate by invoking the callback with prisma-like API
      prismaMock.$transaction.mockImplementation(async (cb: any) => {
        // call the callback with the same mocked prisma so inner calls use our mocks
        await cb(prismaMock);
      });

      prismaMock.product.findUnique.mockResolvedValue({ id: 'p1', stock: 5 });
      prismaMock.product.update.mockResolvedValue({});
      prismaMock.delivery.create.mockResolvedValue({ id: 'd1' });

      const result = await service.processPayment('tx1', {
        cardToken: 'tok_1',
        acceptanceToken: 'at_1',
        address: 'Cll 1',
        city: 'Bogota',
      });

      expect(paymentsMock.createPaymentOnProvider).toHaveBeenCalled();
      expect(prismaMock.transaction.update).toHaveBeenCalled();
      expect(prismaMock.product.update).toHaveBeenCalled();
      expect(prismaMock.delivery.create).toHaveBeenCalled();
      expect(result).toHaveProperty('status', 'COMPLETED');
    });

    it('processPayment saves providerResponse and throws when provider errors', async () => {
      prismaMock.transaction.findUnique.mockResolvedValue(transactionRecord);
      paymentsMock.createPaymentOnProvider.mockRejectedValue({ response: { data: { message: 'invalid token' } } });

      prismaMock.transaction.update.mockResolvedValue({});

      await expect(service.processPayment('tx1', { cardToken: 'bad', acceptanceToken: 'at' })).rejects.toThrow(InternalServerErrorException);

      expect(prismaMock.transaction.update).toHaveBeenCalled();
      const updateArgs = prismaMock.transaction.update.mock.calls[0][0];
      // ensure update includes status FAILED
      expect(updateArgs.data.status).toBe('FAILED');
      expect(updateArgs.data.providerResponse).toBeDefined();
    });

    it('processPayment throws if transaction not found or not pending', async () => {
      prismaMock.transaction.findUnique.mockResolvedValue(null);
      await expect(service.processPayment('no', { cardToken: 'x', acceptanceToken: 'y' })).rejects.toThrow(NotFoundException);

      prismaMock.transaction.findUnique.mockResolvedValue({ ...transactionRecord, status: 'COMPLETED' });
      await expect(service.processPayment('tx1', { cardToken: 'x', acceptanceToken: 'y' })).rejects.toThrow(ConflictException);
    });

    it('processPayment validates tokens presence', async () => {
      prismaMock.transaction.findUnique.mockResolvedValue(transactionRecord);
      await expect(service.processPayment('tx1', { } as any)).rejects.toThrow(BadRequestException);
    });
  });
});