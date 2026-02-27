import { Controller, Post, Body, Headers, Req, UnauthorizedException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { TransactionsService } from '../transactions/transactions.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly transactionsService: TransactionsService,
  ) {}

  @Post('webhook')
  async handleWebhook(
    @Req() req: any,
    @Headers('x-event-checksum') checksum: string,
    @Headers('x-wompi-signature') wompiSignature: string,
  ) {
    const raw = req.rawBody ?? JSON.stringify(req.body);
    const signatureHeader = wompiSignature || checksum;
    const ok = this.paymentsService.verifyWebhookHmac(raw, signatureHeader);

    if (!ok) {
      throw new UnauthorizedException('Firma de evento inválida');
    }

    const payload = req.body;
    const reference = payload?.data?.transaction?.id || payload?.data?.transaction?.reference;
    if (!reference) {
      throw new UnauthorizedException('Referencia no encontrada en payload');
    }

    const result = await this.transactionsService.finalizeByProviderReference(reference, payload);

    console.log('Pago procesado con éxito (webhook):', reference, 'Status:', result.status);
    return { status: 'ok' };
  }
}