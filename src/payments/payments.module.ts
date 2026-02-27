import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { ProductsModule } from '../products/products.module';
@Module({
  imports: [ProductsModule], 
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}