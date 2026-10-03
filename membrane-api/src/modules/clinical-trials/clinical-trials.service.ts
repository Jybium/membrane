import { Injectable, HttpException, HttpStatus, Inject, InternalServerErrorException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ClinicalTrial } from './entities/clinical.trial.entity';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import type { LoggerService } from '@nestjs/common'; 

@Injectable()
export class ClinicalTrialsService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private logger: LoggerService,
    @InjectRepository(ClinicalTrial)
    private readonly clinicalTrialRepo: Repository<ClinicalTrial>,
  ) {}


  async indexClinicalTrial(trialHexId: string, diseaseCode: string){
    try {
      let trial = this.clinicalTrialRepo.create({
        diseaseCode,
        trialHexId
      })
      trial = await this.clinicalTrialRepo.save(trial)
      this.logger.log(`Clinical trial indexed: ${trialHexId}`, ClinicalTrialsService.name)
      return trial
    } catch (error) {
      this.logger.error(`Error indexing clinical trial: ${error.message}`, ClinicalTrialsService.name)
      throw new InternalServerErrorException(`Error indexing clinical trial`)
    }
  }

}
