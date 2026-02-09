import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { LabelingModule } from '../labeling/labeling.module';
import { MetaSleuthService } from '../metasleuth/metasleuth.service';

@Module({
  imports: [LabelingModule],
  providers: [TransactionService, MetaSleuthService],
  controllers: [TransactionController]
})
export class TransactionModule {}
