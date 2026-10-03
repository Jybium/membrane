import { Injectable, HttpException, HttpStatus, Inject, InternalServerErrorException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ClinicalTrial } from './entities/clinical.trial.entity';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import type { LoggerService } from '@nestjs/common'; 
import { PaginatedResult, PaginationQueryDto } from 'src/common/pagination.core';

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


  async getClinicalTrials(pagination: PaginationQueryDto, diseaseCode?: string): Promise<PaginatedResult<ClinicalTrial>>{
    try {
      const { page, limit } = pagination;
      const skip = (page - 1) * limit;

      const [data, total] = await this.clinicalTrialRepo.findAndCount({
        skip,
        take: limit,
        where: diseaseCode ? { diseaseCode } : {},
        order: { id: 'DESC' }
      })
      
      return {
        data,
        meta: {
          totalItems: total,
          itemCount: data.length,
          itemsPerPage: limit,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
        },
      };
    } catch (error) {
      this.logger.error(`Error getting indexed clinical trials: ${error.message}`, ClinicalTrialsService.name)
      throw new InternalServerErrorException(`Error getting indexed clinical trials`)
    }
  }

}
