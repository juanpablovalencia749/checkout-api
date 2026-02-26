import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaService;

  // Creamos un objeto falso de Prisma
  const mockPrismaService = {
    product: {
      findMany: jest.fn().mockResolvedValue([{ id: '1', name: 'Producto Test', price: 100 }]),
      findUnique: jest.fn().mockResolvedValue({ id: '1', name: 'Producto Test', price: 100 }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService, // Usamos el falso en lugar del real
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all products', async () => {
    const products = await service.findAll();
    expect(products).toBeInstanceOf(Array);
    expect(prisma.product.findMany).toHaveBeenCalled();
  });
});