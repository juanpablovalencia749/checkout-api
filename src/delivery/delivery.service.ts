import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DeliveryService {
  constructor(private prisma: PrismaService) {}


  async findAll() {
    const items = await this.prisma.delivery.findMany({
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
    return items.map((d) => ({
      status: d.status,
      address: `${d.address}${d.city ? ', ' + d.city : ''}`,
      productName: d.transaction.product.name,
      user: d.transaction.customer.fullName,
      email: d.transaction.customer.email,
      quantity: d.transaction.quantity,
      transactionId: d.transaction.id,
    }));
  }
}
