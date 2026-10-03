import { Test, TestingModule } from '@nestjs/testing';
import { ClinicalTrialsService } from './clinical-trials.service';

describe('ClinicalTrialsService', () => {
  let service: ClinicalTrialsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClinicalTrialsService],
    }).compile();

    service = module.get<ClinicalTrialsService>(ClinicalTrialsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
