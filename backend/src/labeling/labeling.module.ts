import { Module } from '@nestjs/common';
import { LabelingService } from './labeling.service';

@Module({
  providers: [LabelingService],
  exports: [LabelingService],
})
export class LabelingModule {}
