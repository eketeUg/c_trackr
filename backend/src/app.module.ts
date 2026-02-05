import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TransactionModule } from './transaction/transaction.module';
import { LabelingModule } from './labeling/labeling.module';

@Module({
  imports: [TransactionModule, LabelingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
