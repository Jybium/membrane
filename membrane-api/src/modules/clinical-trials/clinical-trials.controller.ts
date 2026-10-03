import { Controller, Post, Body } from '@nestjs/common';
import { ClinicalTrialsService } from './clinical-trials.service';
import { IndexClinicalTrialDto } from './dtos/clinical.trial.dto';

@Controller('clinical-trials')
export class ClinicalTrialsController {
  constructor(
    private readonly clinicalTrialService: ClinicalTrialsService,
  ) {}


  @Post('index')
  async indexClinicalTrial(@Body() body: IndexClinicalTrialDto) {
    return this.clinicalTrialService.indexClinicalTrial(
      body.trialHexId,
      body.diseaseCode,
    )
  }
}
