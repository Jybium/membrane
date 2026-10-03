import { Test, TestingModule } from '@nestjs/testing';
import { DemoAHospitalDataService } from './demo.a.hospital.data.service';

describe('DemoAHospitalDataService', () => {
  let service: DemoAHospitalDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DemoAHospitalDataService],
    }).compile();

    service = module.get<DemoAHospitalDataService>(DemoAHospitalDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
