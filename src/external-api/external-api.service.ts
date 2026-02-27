import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class ExternalApiService {
  private readonly client: AxiosInstance;
  private readonly base: string;
  private readonly privateKey: string;
  private readonly publicKey: string;
  private readonly integrityKey: string;

  constructor() {
    this.base = process.env.WOMPI_API_URL || 'https://api-sandbox.co.uat.wompi.dev/v1';
    this.privateKey = process.env.WOMPI_PRIVATE_KEY || '';
    this.publicKey = process.env.WOMPI_PUBLIC_KEY || '';
    this.integrityKey = process.env.WOMPI_INTEGRITY_SECRET || '';

    this.client = axios.create({
      baseURL: this.base,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
  }

async createTransaction(body: any) {
    try {
      const res = await this.client.post('/transactions', body, {
        headers: {
          Authorization: `Bearer ${this.privateKey}`,
        },
      });

      return res.data;
    } catch (err: any) {
      const errData =
        err?.response?.data ??
        err?.message ??
        err;

      console.error('[ExternalApiService] createTransaction error:', errData);

      throw new InternalServerErrorException(errData);
    }
  }
  // Obtener datos de acceptance (si aplica) - puede ser util en futuro
  async getMerchantData() {
    try {
      // Algunos endpoints de merchant pueden no existir; tratar con try/catch
      const rawUrl = this.base.replace('/v1', '');
      const res = await axios.get(`${rawUrl}/merchants/${this.publicKey}`);
      return res.data;
    } catch (err) {
      return null;
    }
  }

  // Método de utilidad para verificar HMAC de eventos (si añades webhooks luego)
  getIntegrityKey() {
    return this.integrityKey;
  }
}