import { Module } from '@nestjs/common';
import { ClinicalTrialsService } from './clinical-trials.service';
import { ClinicalTrialsController } from './clinical-trials.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClinicalTrial } from './entities/clinical.trial.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClinicalTrial])
  ],
  providers: [ClinicalTrialsService],
  controllers: [ClinicalTrialsController]
})
export class ClinicalTrialsModule {}
