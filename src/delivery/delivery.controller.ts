import { Controller, Get } from '@nestjs/common';
import { DeliveryService } from './delivery.service';

@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get()
  async findAll() {
    const list = await this.deliveryService.findAll();
    return { success: true, data: list };
  }
}
