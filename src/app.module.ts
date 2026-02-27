import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { PrismaModule } from './prisma/prisma.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [ ProductsModule,PrismaModule, PaymentsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
