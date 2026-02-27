import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ExternalApiService } from '../external-api/external-api.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly externalApi: ExternalApiService) {}

  async createPaymentOnProvider(payload: any) {
    try {
      const response = await this.externalApi.createTransaction(payload);
      return response;
    } catch (err: any) {
      const errData =
        err?.response?.data ??
        err?.message ??
        err;

      console.error('[PaymentsService] Provider error:', errData);

      throw new InternalServerErrorException(errData);
    }
  }

  // Proxy para obtener datos de merchant / acceptance si lo necesitas
  async getAcceptanceData() {
    return this.externalApi.getMerchantData();
  }

  // Expone llave integridad por si quieres verificar hmac en webhooks
  getIntegrityKey() {
    return this.externalApi.getIntegrityKey();
  }
}