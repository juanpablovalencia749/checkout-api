import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryService } from './delivery.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DeliveryService', () => {
  let service: DeliveryService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      delivery: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<DeliveryService>(DeliveryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns mapped list with required fields', async () => {
      const fakeDeliveries = [
        {
          id: 'd1',
          status: 'PENDING',
          address: 'Calle 1',
          city: 'Bogota',
          transaction: {
            id: 'tx1',
            quantity: 2,
            product: { name: 'Producto X' },
            customer: {
              fullName: 'Juan Perez',
              email: 'juan@example.com',
            },
          },
        },
      ];
      prismaMock.delivery.findMany.mockResolvedValue(fakeDeliveries);

      const result = await service.findAll();

      expect(prismaMock.delivery.findMany).toHaveBeenCalledWith({
        include: {
          transaction: {
            include: {
              customer: true,
              product: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toEqual([
        {
          status: 'PENDING',
          address: 'Calle 1, Bogota',
          productName: 'Producto X',
          user: 'Juan Perez',
          email: 'juan@example.com',
          quantity: 2,
          transactionId: 'tx1',
        },
      ]);
    });

    it('handles missing city gracefully', async () => {
      const fakeDeliveries = [
        {
          id: 'd2',
          status: 'APPROVED',
          address: 'Carrera 5',
          city: '',
          transaction: {
            id: 'tx2',
            quantity: 1,
            product: { name: 'Otro' },
            customer: {
              fullName: 'Ana',
              email: 'ana@example.com',
            },
          },
        },
      ];
      prismaMock.delivery.findMany.mockResolvedValue(fakeDeliveries);

      const result = await service.findAll();
      expect(result[0].address).toBe('Carrera 5');
    });
  });
});