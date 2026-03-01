// src/payments/payments.service.ts
import {
  Injectable,
  InternalServerErrorException,
  MessageEvent,
} from '@nestjs/common';
import { ExternalApiService } from '../external-api/external-api.service';
import { PrismaService } from 'src/prisma/prisma.service';
import * as crypto from 'crypto';
import { Subject, Observable } from 'rxjs';

@Injectable()
export class PaymentsService {
  private transactionStreams = new Map<string, Subject<MessageEvent>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly externalApi: ExternalApiService,
  ) {}

  // ============================================
  // 💳 Crear pago en proveedor (Wompi)
  // ============================================
  async createPaymentOnProvider(payload: any) {
    try {
      return await this.externalApi.createTransaction(payload);
    } catch (err: any) {
      console.error('[PaymentsService] Provider error:', err);
      throw new InternalServerErrorException(err);
    }
  }

  // ============================================
  // 📄 Obtener acceptance token
  // ============================================
  async getAcceptanceData() {
    const merchantData = await this.externalApi.getMerchantData();
    return merchantData?.data?.presigned_acceptance ?? null;
  }

  // ============================================
  // 🔐 Integrity Key
  // ============================================
  getIntegrityKey() {
    return this.externalApi.getIntegrityKey();
  }

  // ============================================
  // 🔐 Verificar firma Webhook
  // ============================================
  verifyWebhookSignature(body: any): boolean {
    const integrityKey = this.externalApi.getIntegrityKey();
    const props = body.signature?.properties ?? [];

    let stringToHash = '';

    for (const propPath of props) {
      const value = propPath
        .split('.')
        .reduce((acc: any, key: string) => acc?.[key], body);

      stringToHash += value ?? '';
    }

    const checksum = crypto
      .createHash('sha256')
      .update(stringToHash + integrityKey)
      .digest('hex');

    return checksum === body.signature?.checksum;
  }


  async handleTransactionUpdated(tx: any) {
  console.log(
    '[PaymentsService] Transaction updated:',
    tx?.reference,
    tx?.status,
  );

  if (!tx?.reference) {
    throw new InternalServerErrorException(
      'Transaction reference missing in webhook data',
    );
  }

  const existingTransaction =
    await this.prisma.transaction.findUnique({
      where: { id: tx.reference },
    });

  if (!existingTransaction) {
    console.warn(
      '[PaymentsService] Transaction not found:',
      tx.reference,
    );
    return null;
  }

  const currentStatus = existingTransaction.status;

  const allowedTransitions: Record<string, string[]> = {
    PENDING: ['APPROVED', 'DECLINED', 'VOIDED'],
    APPROVED: [],
    DECLINED: [],
    VOIDED: [],
  };

  if (!allowedTransitions[currentStatus]?.includes(tx.status)) {
    console.warn(
      `[PaymentsService] Invalid transition: ${currentStatus} → ${tx.status}`,
    );
    return existingTransaction;
  }

  const updated = await this.prisma.$transaction(async (prisma) => {
    
    const updatedTransaction = await prisma.transaction.update({
      where: { id: existingTransaction.id },
      data: {
        status: tx.status,
        wompiId: tx.id,
        providerResponse: JSON.stringify(tx),
      },
    });

    if (tx.status === 'APPROVED') {

      await prisma.product.update({
        where: { id: existingTransaction.productId },
        data: {
          stock: {
            decrement: existingTransaction.quantity,
          },
        },
      });

      await prisma.delivery.update({
        where: { transactionId: existingTransaction.id },
        data: {
          status: 'APPROVED',
        },
      });
    }

    return updatedTransaction;
  });

  console.log(
    '[PaymentsService] Updated in DB:',
    updated.id,
    updated.status,
  );

  this.emitTransactionUpdate(updated.id, updated.status);

  if (['APPROVED', 'DECLINED', 'VOIDED'].includes(updated.status)) {
    this.completeTransactionStream(updated.id);
  }

  return updated;
}

  // ============================================
  // 📡 SSE - Suscribirse
  // ============================================
  subscribeToTransaction(
    id: string,
  ): Observable<MessageEvent> {
    if (!this.transactionStreams.has(id)) {
      this.transactionStreams.set(
        id,
        new Subject<MessageEvent>(),
      );
    }

    return this.transactionStreams.get(id)!.asObservable();
  }

  // ============================================
  // 📡 SSE - Emitir actualización
  // ============================================
private emitTransactionUpdate(id: string, status: string) {
  const stream = this.transactionStreams.get(id);
  if (stream) {
    console.log(`[SSE] Emitiendo estado ${status} para tx ${id}`);
    stream.next({
      data: { id, status },
    } as MessageEvent);
  }
}

private completeTransactionStream(id: string) {
  const stream = this.transactionStreams.get(id);
  if (stream) {
    setTimeout(() => {
      stream.complete();
      this.transactionStreams.delete(id);
      console.log(`[SSE] Stream limpiado para ${id}`);
    }, 2000);
  }
}
}
