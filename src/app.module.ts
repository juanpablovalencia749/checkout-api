import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { PrismaModule } from './prisma/prisma.module';
import { PaymentsModule } from './payments/payments.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ExternalApiModule } from './external-api/external-api.module';
import { DeliveryModule } from './delivery/delivery.module';

@Module({
  imports: [ ProductsModule, PrismaModule, PaymentsModule, TransactionsModule, ExternalApiModule, DeliveryModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
