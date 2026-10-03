import { Test, TestingModule } from '@nestjs/testing';
import { ClinicalTrialsController } from './clinical-trials.controller';

describe('ClinicalTrialsController', () => {
  let controller: ClinicalTrialsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClinicalTrialsController],
    }).compile();

    controller = module.get<ClinicalTrialsController>(ClinicalTrialsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
