import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly txService: TransactionsService) {}

  @Post()
  async create(@Body() dto: CreateTransactionDto) {
    const tx = await this.txService.create(dto);
    return { success: true, data: tx };
  }

  @Post(':id/process')
  async process(@Param('id') id: string, @Body() body: any) {
    const result = await this.txService.processPayment(id, body);
    return { success: true, data: result };
  }

  @Get()
  async findAll() {
    const list = await this.txService.findAll();
    return { success: true, data: list };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const t = await this.txService.findOne(id);
    return { success: true, data: t };
  }
}