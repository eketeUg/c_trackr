import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { LabelingModule } from '../labeling/labeling.module';

@Module({
  imports: [LabelingModule],
  providers: [TransactionService],
  controllers: [TransactionController]
})
export class TransactionModule {}
