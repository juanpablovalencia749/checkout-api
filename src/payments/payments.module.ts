// src/payments/payments.module.ts
import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ExternalApiModule } from '../external-api/external-api.module';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [ExternalApiModule],
    controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}