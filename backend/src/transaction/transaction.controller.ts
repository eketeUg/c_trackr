import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { TransactionService } from './transaction.service';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get('flow')
  async getTransactionFlow(@Query('chain') chain: string, @Query('hash') hash: string) {
    if (!chain || !hash) {
        throw new BadRequestException('Chain and Hash are required');
    }
    return this.transactionService.getTransactionFlow(chain, hash);
  }
}
