import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
// import { WompiService } from '../wompi/wompi.service';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    // private wompi: WompiService,
  ) {}

  async create(dto: CreateTransactionDto) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.stock < dto.quantity) throw new BadRequestException('Not enough stock');

    let customer = await this.prisma.customer.findUnique({ where: { email: dto.customerEmail } });
    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          email: dto.customerEmail,
          fullName: dto.customerFullName,
          phoneNumber: dto.customerPhone,
        },
      });
    }

    const transaction = await this.prisma.transaction.create({
      data: {
        amount: dto.amount,
        status: 'PENDING',
        customerId: customer.id,
        productId: product.id,
        quantity: dto.quantity,
      },
    });

    return transaction;
  }

  findAll() {
    return this.prisma.transaction.findMany({
      include: { customer: true, product: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const t = await this.prisma.transaction.findUnique({
      where: { id },
      include: { customer: true, product: true },
    });
    if (!t) throw new NotFoundException('Transaction not found');
    return t;
  }

  async processPayment(transactionId: string, paymentPayload: any) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { product: true, customer: true },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.status !== 'PENDING') throw new ConflictException('Transaction already processed');

    const wompiPayload = {
      amount_in_cents: Math.round(transaction.amount * 100),
      currency: 'COP',
      payment_method: {
        type: 'CARD',
        installments: 1,
        card: paymentPayload.card, 
      },
    };

    let wompiResponse;
    try {
    } catch (err) {
      await this.prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'FAILED' },
      });
      throw err;
    }

    const wompiId = wompiResponse?.data?.id || wompiResponse?.id || 'wompi-simulated-id';
    const status = (wompiResponse?.data?.status || 'APPROVED') === 'APPROVED' ? 'COMPLETED' : 'FAILED';

    await this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        wompiId,
        status,
      },
    });

    if (status === 'COMPLETED') {
      await this.prisma.$transaction(async (prisma) => {
        const prod = await prisma.product.findUnique({ where: { id: transaction.productId } });
        if (!prod) throw new NotFoundException('Product not found during stock update');
        if (prod.stock < transaction.quantity) throw new BadRequestException('Not enough stock at processing time');
        await prisma.product.update({
          where: { id: prod.id },
          data: { stock: { decrement: transaction.quantity } as any },
        });

        await prisma.delivery.create({
          data: {
            transactionId: transaction.id,
            address: paymentPayload.address || 'Not provided',
            city: paymentPayload.city || 'Not provided',
          },
        });
      });
    }

    return { transactionId, status, wompiId };
  }
  async finalizeByProviderReference(reference: string, payload: any) {
  const transaction = await this.prisma.transaction.findUnique({
    where: { wompiId: reference },
    include: { product: true, customer: true },
  });

  if (!transaction) {
    throw new NotFoundException(`Transaction not found for reference ${reference}`);
  }

  const status = payload?.data?.transaction?.status || 'FAILED';

  await this.prisma.transaction.update({
    where: { id: transaction.id },
    data: { status },
  });

  if (status === 'APPROVED' || status === 'COMPLETED') {
    await this.prisma.$transaction(async (prisma) => {
      const prod = await prisma.product.findUnique({ where: { id: transaction.productId } });
      if (!prod) throw new NotFoundException('Product not found during stock update');
      if (prod.stock < transaction.quantity) throw new BadRequestException('Not enough stock');
      await prisma.product.update({
        where: { id: prod.id },
        data: { stock: { decrement: transaction.quantity } as any },
      });

      await prisma.delivery.create({
        data: {
          transactionId: transaction.id,
          address: payload?.data?.customer?.address || 'No address',
          city: payload?.data?.customer?.city || 'Unknown',
        },
      });
    });
  }

  return { transactionId: transaction.id, status };
}
}