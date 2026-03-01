import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryController } from './delivery.controller';
import { DeliveryService } from './delivery.service';

describe('DeliveryController', () => {
  let controller: DeliveryController;
  let service: Partial<Record<keyof DeliveryService, jest.Mock>>;

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeliveryController],
      providers: [{ provide: DeliveryService, useValue: service }],
    }).compile();

    controller = module.get<DeliveryController>(DeliveryController);
  });

  it('should return list from service', async () => {
    const list = [{ estado: 'PENDING' }];
    (service.findAll as jest.Mock).mockResolvedValue(list);

    const res = await controller.findAll();
    expect(res).toEqual({ success: true, data: list });
    expect(service.findAll).toHaveBeenCalled();
  });
});