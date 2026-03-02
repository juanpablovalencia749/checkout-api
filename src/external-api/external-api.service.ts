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

  async createTransaction(body: any) {
    try {
      const payload = { ...body };


      const reference = String(payload.reference ?? '').trim();
      const amountInCents =
        Number(payload.amount_in_cents ?? payload.amount ?? 0);
      const currency = String(payload.currency ?? 'COP').trim();

      if (!reference) {
        throw new Error('Missing reference to generate integrity signature');
      }
      if (!amountInCents || Number.isNaN(amountInCents)) {
        throw new Error('Missing or invalid amount_in_cents to generate integrity signature');
      }
      if (!this.integrityKey) {
        throw new Error('WOMPI_INTEGRITY_SECRET not configured in environment');
      }

      const signatureBase = `${reference}${amountInCents}${currency}${this.integrityKey}`;
      const signature = crypto.createHash('sha256').update(signatureBase).digest('hex');

      payload.signature = signature;

      const res = await this.client.post('/transactions', payload, {
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

  async getMerchantData() {
    try {
      const res = await this.client.get(`/merchants/${this.publicKey}`);
      return res.data;
    } catch (err) {
      console.error('[ExternalApiService] getMerchantData error:', err?.response?.data ?? err?.message);
      return null;
    }
  }

  getIntegrityKey() {
    return this.integrityKey;
  }
}