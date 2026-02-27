// src/transactions/transactions.module.ts
import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsModule } from '../payments/payments.module';
import { ExternalApiModule } from '../external-api/external-api.module';

@Module({
  imports: [PaymentsModule, ExternalApiModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, PrismaService],
  exports: [TransactionsService],
})
export class TransactionsModule {}