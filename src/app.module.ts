import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { PrismaModule } from './prisma/prisma.module';
import { PaymentsModule } from './payments/payments.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ExternalApiModule } from './external-api/external-api.module';

@Module({
  imports: [ ProductsModule,PrismaModule, PaymentsModule, TransactionsModule, ExternalApiModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
