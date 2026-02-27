// src/payments/payments.service.spec.ts
import { PaymentsService } from './payments.service';
import axios from 'axios';
import * as crypto from 'crypto';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(() => {
    process.env.WOMPI_PRIVATE_KEY = 'test_private';
    process.env.WOMPI_PUBLIC_KEY = 'test_public';
    process.env.WOMPI_INTEGRITY_KEY = 'test_integrity';

    service = new PaymentsService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createWompiTransaction', () => {
    it('should call wompi API and return data', async () => {
      const mockResponse = {
        data: {
          data: {
            id: 'txn_123',
            status: 'APPROVED',
          },
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse as any);

      const body = { amount_in_cents: 10000 };

      const result = await service.createWompiTransaction(body);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/transactions'),
        body,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test_private',
          }),
        }),
      );

      expect(result).toEqual(mockResponse.data);
    });

    it('should throw error if wompi fails', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Wompi error'));

      await expect(
        service.createWompiTransaction({}),
      ).rejects.toThrow();
    });
  });

  describe('verifyWebhookHmac', () => {
    it('should validate correct signature', () => {
      const rawBody = JSON.stringify({ test: 'data' });
      const signature = crypto
        .createHmac('sha256', 'test_integrity')
        .update(rawBody)
        .digest('hex');

      const isValid = service.verifyWebhookHmac(rawBody, signature);

      expect(isValid).toBe(true);
    });

    it('should return false if signature invalid', () => {
      const rawBody = JSON.stringify({ test: 'data' });

      const isValid = service.verifyWebhookHmac(rawBody, 'wrong_signature');

      expect(isValid).toBe(false);
    });
  });
});