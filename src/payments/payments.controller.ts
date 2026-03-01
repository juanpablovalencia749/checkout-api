// src/payments/payments.controller.ts
import {
  Controller,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Post,
  BadRequestException,
  Sse,
  Param,
  MessageEvent 
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Observable } from 'rxjs';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(@Body() body: any) {
    try {
      console.log('[Webhook] Incoming body:', JSON.stringify(body));

      if (!body?.event) {
        throw new BadRequestException('Missing event type');
      }
      const isProduction = process.env.NODE_ENV === 'production';
      if (isProduction) {
        const isValid = this.paymentsService.verifyWebhookSignature(body);
        if (!isValid) {
          console.warn('[Webhook] Invalid signature');
          throw new BadRequestException('Invalid signature');
        }
      }

      if (body.event === 'transaction.updated') {
        await this.paymentsService.handleTransactionUpdated(body.data);
      } else {
        console.log('[Webhook] Event not handled:', body.event);
      }

      return { success: true };
    } catch (err) {
      console.error('[Webhook] Error processing webhook:', err);
      return { success: false };
    }
  }

  @Get('acceptance-data')
  async acceptanceData() {
    const data = await this.paymentsService.getAcceptanceData();
    return { success: true, data };
  }

   @Sse('transactions/:id/events')
  sse(@Param('id') id: string): Observable<MessageEvent> {    
    return this.paymentsService.subscribeToTransaction(id);
  }
}