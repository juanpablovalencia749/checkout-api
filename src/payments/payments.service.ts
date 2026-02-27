import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private base = process.env.WOMPI_SANDBOX_URL || 'https://api-sandbox.co.uat.wompi.dev/v1';
  private privateKey = process.env.WOMPI_PRIVATE_KEY;       
  private publicKey = process.env.WOMPI_PUBLIC_KEY;         
  private integrityKey = process.env.WOMPI_INTEGRITY_KEY || process.env.WOMPI_EVENTS_SECRET;

  async createWompiTransaction(body: any) {
    try {
      const url = `${this.base}/transactions`;
      const res = await axios.post(url, body, {
        headers: {
          Authorization: `Bearer ${this.privateKey}`,
          'Content-Type': 'application/json',
        },
      });
      return res.data;
    } catch (err) {
      console.error('Wompi create transaction error:', err?.response?.data || err?.message || err);
      throw new InternalServerErrorException('Error calling payment provider');
    }
  }


  async getAcceptanceData() {
    try {
      const url = `${this.base.replace('/v1','')}/merchants/${this.publicKey}`.replace('//merchants','/merchants'); 
      const res = await axios.get(`${this.base.replace('/v1','')}/merchants/${this.publicKey}`);
      return res.data;
    } catch (err) {
      return null;
    }
  }

  verifyWebhookHmac(rawBody: Buffer | string, receivedSignature: string): boolean {
    if (!this.integrityKey || !receivedSignature) return false;

    const expectedBuffer = crypto.createHmac('sha256', this.integrityKey)
                                 .update(rawBody)
                                 .digest();
    const receivedBuffer = Buffer.from(receivedSignature.trim(), 'hex');
    if (receivedBuffer.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  }
}