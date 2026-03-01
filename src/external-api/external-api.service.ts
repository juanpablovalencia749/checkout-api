// src/external-api/external-api.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

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

  /**
   * Crea una transacción en el proveedor (Wompi) asegurando que el payload
   * incluya la firma de integridad (SHA256 of reference + amount + currency + integrityKey).
   *
   * body: debe contener al menos:
   *  - reference (string)
   *  - amount_in_cents (number)
   *  - currency (string)
   *  - payment_method (object) ...
   */
  async createTransaction(body: any) {
    try {
      // Hacer copia del payload para no mutar el objeto original
      const payload = { ...body };

      // Normalizar los campos que vamos a usar para la firma
      // Wompi espera amount_in_cents (entero). Si se envía `amount`, lo consideramos separadamente.
      const reference = String(payload.reference ?? '').trim();
      const amountInCents =
        Number(payload.amount_in_cents ?? payload.amount ?? 0);
      const currency = String(payload.currency ?? 'COP').trim();

      // Validaciones mínimas para poder generar signature
      if (!reference) {
        throw new Error('Missing reference to generate integrity signature');
      }
      if (!amountInCents || Number.isNaN(amountInCents)) {
        throw new Error('Missing or invalid amount_in_cents to generate integrity signature');
      }
      if (!this.integrityKey) {
        throw new Error('WOMPI_INTEGRITY_SECRET not configured in environment');
      }

      // Generar la firma de integridad: sha256(reference + amount + currency + integrityKey)
      const signatureBase = `${reference}${amountInCents}${currency}${this.integrityKey}`;
      const signature = crypto.createHash('sha256').update(signatureBase).digest('hex');

      // Añadir signature al payload según la doc
      payload.signature = signature;

      // (Opcional) log para debugging — evita imprimir datos sensibles en producción.
      console.log('[ExternalApiService] Creating provider transaction with signature:', signature);

      // Realizar la llamada a Wompi con PRIVATE KEY
      const res = await this.client.post('/transactions', payload, {
        headers: {
          Authorization: `Bearer ${this.privateKey}`,
        },
      });

      return res.data;
    } catch (err: any) {
      // Normalizar error para logging
      const errData =
        err?.response?.data ??
        err?.message ??
        err;

      console.error('[ExternalApiService] createTransaction error:', errData);
      // Lanzar InternalServerError para que servicios superiores lo manejen (TransactionsService)
      throw new InternalServerErrorException(errData);
    }
  }

  // Obtener datos de acceptance (si aplica)
  async getMerchantData() {
    try {
      const res = await this.client.get(`/merchants/${this.publicKey}`);
      return res.data;
    } catch (err) {
      console.error('[ExternalApiService] getMerchantData error:', err?.response?.data ?? err?.message);
      return null;
    }
  }

  // Método de utilidad para verificar HMAC/firmas en webhooks (si lo necesitas)
  getIntegrityKey() {
    return this.integrityKey;
  }
}