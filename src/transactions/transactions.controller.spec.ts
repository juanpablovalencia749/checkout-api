import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from 'src/transactions/transactions.controller';
import { TransactionsService } from 'src/transactions/transactions.service';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let service: Partial<Record<keyof TransactionsService, jest.Mock>>;

  beforeEach(async () => {
    // Mock simple service with Jest
    service = {
      create: jest.fn(),
      processPayment: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        {
          provide: TransactionsService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create() should call service.create and return transaction', async () => {
    const dto = { productId: 'p1', quantity: 1, amount: 1500, customerEmail: 'a@x.com', customerFullName: 'A', customerPhone: '300' };
    const created = { id: 'tx1', ...dto, status: 'PENDING' };
    (service.create as jest.Mock).mockResolvedValue(created);

    const res = await controller.create(dto as any);
    expect(service.create).toHaveBeenCalledWith(dto);
    expect(res).toEqual({ success: true, data: created });
  });

  it('process() should call service.processPayment and return result', async () => {
    const txId = 'tx1';
    const body = { cardToken: 'tok_1', acceptanceToken: 'at_1' };
    const result = { transactionId: txId, status: 'COMPLETED', providerId: 'prov1' };
    (service.processPayment as jest.Mock).mockResolvedValue(result);

    const res = await controller.process(txId, body);
    expect(service.processPayment).toHaveBeenCalledWith(txId, body);
    expect(res).toEqual({ success: true, data: result });
  });

  it('findAll() should return list from service', async () => {
    const list = [{ id: 'tx1' }, { id: 'tx2' }];
    (service.findAll as jest.Mock).mockResolvedValue(list);

    const res = await controller.findAll();
    expect(service.findAll).toHaveBeenCalled();
    expect(res).toEqual({ success: true, data: list });
  });

  it('findOne() should return item from service', async () => {
    const item = { id: 'tx1' };
    (service.findOne as jest.Mock).mockResolvedValue(item);

    const res = await controller.findOne('tx1');
    expect(service.findOne).toHaveBeenCalledWith('tx1');
    expect(res).toEqual({ success: true, data: item });
  });
});