import { Controller, Post, Body, Query, Get } from '@nestjs/common';
import { ClinicalTrialsService } from './clinical-trials.service';
import { IndexClinicalTrialDto } from './dtos/clinical.trial.dto';
import { ClinicalTrial } from './entities/clinical.trial.entity';
import { PaginatedResult, PaginationQueryDto } from 'src/common/pagination.core';


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

  @Get('index')
  async getClinicalTrials(
    @Query() pagination: PaginationQueryDto,
    @Query('diseaseCode') diseaseCode?: string,
  ): Promise<PaginatedResult<ClinicalTrial>> {
    return await this.clinicalTrialService.getClinicalTrials(pagination, diseaseCode)
  }
}
