import { Test, TestingModule } from '@nestjs/testing';
import { DemoAHospitalDataController } from './demo.a.hospital.data.controller';

describe('DemoAHospitalDataController', () => {
  let controller: DemoAHospitalDataController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DemoAHospitalDataController],
    }).compile();

    controller = module.get<DemoAHospitalDataController>(DemoAHospitalDataController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
