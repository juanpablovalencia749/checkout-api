// src/transactions/transactions.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private paymentsService: PaymentsService,
  ) {}

 async create(dto: CreateTransactionDto) {
  const product = await this.prisma.product.findUnique({
    where: { id: dto.productId },
  });

  if (!product) throw new NotFoundException('Product not found');
  if (product.stock < dto.quantity)
    throw new BadRequestException('Not enough stock');

  let customer = await this.prisma.customer.findUnique({
    where: { email: dto.customerEmail },
  });

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
      delivery: {
        create: {
          address: dto.address,
          city: dto.city,
        },
      },
    },
    include: {
      delivery: true,
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
  if (transaction.status !== 'PENDING')
    throw new ConflictException('Transaction already processed');

  if (!paymentPayload?.cardToken || !paymentPayload?.acceptanceToken) {
    throw new BadRequestException(
      'cardToken and acceptanceToken are required',
    );
  }

  const rawAmount = Number(transaction.amount ?? 0);
  let amountInCents: number;
  if (Number.isNaN(rawAmount)) {
    throw new BadRequestException('Invalid transaction.amount');
  }
  if (rawAmount >= 1000) {
    amountInCents = Math.round(rawAmount);
  } else {
    amountInCents = Math.round(rawAmount * 100);
  }

  const wompiPayload = {
    amount_in_cents: amountInCents,
    currency: 'COP',
    customer_email: transaction.customer.email,
    reference: transaction.id,
    payment_method: {
      type: 'CARD',
      token: paymentPayload.cardToken,
      installments: paymentPayload.installments || 1,
    },
    acceptance_token: paymentPayload.acceptanceToken,
  };

  console.log('[TransactionsService] Sending payload to provider:', JSON.stringify(wompiPayload));

  let providerResponse;
  try {
    providerResponse = await this.paymentsService.createPaymentOnProvider(wompiPayload);
  } catch (err: any) {
    const errorDetail =
      err?.response?.data ??
      err?.message ??
      err;

    await this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'FAILED',
        providerResponse:
          typeof errorDetail === 'string'
            ? errorDetail
            : JSON.stringify(errorDetail),
      },
    });

    console.error('[TransactionsService] Provider call failed:', errorDetail);
    throw new InternalServerErrorException(
      'Error processing payment with provider',
    );
  }
  console.log('[TransactionsService] providerResponse raw:', JSON.stringify(providerResponse));

  const data = providerResponse?.data ?? providerResponse;
  const providerTx = data?.data ?? data;

  console.log('[TransactionsService] providerTx:', JSON.stringify(providerTx));

  const providerId = providerTx?.id || null;
  const providerStatus = (providerTx?.status || providerTx?.status_detail || '').toUpperCase() || 'FAILED';

  console.log(`[TransactionsService] providerStatus: ${providerStatus}, providerId: ${providerId}`);

  const finalStatus =
  providerStatus === 'APPROVED' || providerStatus === 'COMPLETED'
    ? 'COMPLETED'
    : providerStatus === 'PENDING'
      ? 'PENDING'
      : 'FAILED'
      
  await this.prisma.transaction.update({
    where: { id: transactionId },
    data: {
      wompiId: providerId,
      status: finalStatus,
      providerResponse: JSON.stringify(providerResponse),
    },
  });

  if (finalStatus === 'COMPLETED') {
    await this.prisma.$transaction(async (prisma) => {
      const product = await prisma.product.findUnique({
        where: { id: transaction.productId },
      });

      if (!product)
        throw new NotFoundException('Product not found');

      if (product.stock < transaction.quantity)
        throw new BadRequestException('Not enough stock');

      await prisma.product.update({
        where: { id: product.id },
        data: {
          stock: product.stock - transaction.quantity,
        },
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

  return {
    transactionId,
    status: finalStatus,
    providerId,
  };
}
}