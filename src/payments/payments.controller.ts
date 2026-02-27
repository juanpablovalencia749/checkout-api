import { Controller, Get } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // Devuelve datos del merchant / acceptance si la API los soporta
  @Get('acceptance-data')
  async acceptanceData() {
    const data = await this.paymentsService.getAcceptanceData();
    return { success: true, data };
  }
}