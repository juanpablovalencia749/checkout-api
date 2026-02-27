import { Test, TestingModule } from '@nestjs/testing';
import { ExternalApiService } from './external-api.service';
import axios from 'axios';
import { InternalServerErrorException } from '@nestjs/common';

jest.mock('axios');

describe('ExternalApiService', () => {
  let service: ExternalApiService;

  const mockAxiosInstance = {
    post: jest.fn(),
  };

  beforeEach(async () => {
    process.env.WOMPI_PRIVATE_KEY = 'test_private_key';
    process.env.WOMPI_PUBLIC_KEY = 'test_public_key';
    process.env.WOMPI_API_URL = 'https://fake-url.com/v1';

    (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);

    const module: TestingModule = await Test.createTestingModule({
      providers: [ExternalApiService],
    }).compile();

    service = module.get<ExternalApiService>(ExternalApiService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create transaction successfully', async () => {
    const mockResponse = { data: { id: 'tx_123' } };

    mockAxiosInstance.post.mockResolvedValue(mockResponse);

    const result = await service.createTransaction({ amount: 1000 });

    expect(mockAxiosInstance.post).toHaveBeenCalledWith(
      '/transactions',
      { amount: 1000 },
      {
        headers: {
          Authorization: 'Bearer test_private_key',
        },
      },
    );

    expect(result).toEqual(mockResponse.data);
  });

  it('should throw InternalServerErrorException on error', async () => {
    mockAxiosInstance.post.mockRejectedValue({
      response: {
        data: { error: 'Invalid request' },
      },
    });

    await expect(
      service.createTransaction({ amount: 1000 }),
    ).rejects.toThrow(InternalServerErrorException);
  });

  it('should return integrity key', () => {
    process.env.WOMPI_INTEGRITY_SECRET = 'secret_key';
    const newService = new ExternalApiService();
    expect(newService.getIntegrityKey()).toBe('secret_key');
  });
});