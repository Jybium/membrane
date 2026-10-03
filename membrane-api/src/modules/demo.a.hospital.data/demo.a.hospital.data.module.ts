import { Module } from '@nestjs/common';
import { DemoAHospitalDataService } from './demo.a.hospital.data.service';
import { DemoAHospitalDataController } from './demo.a.hospital.data.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DemoAHospitalConsentedPatients } from './entities/consented.patients.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DemoAHospitalConsentedPatients])
  ],
  providers: [DemoAHospitalDataService],
  controllers: [DemoAHospitalDataController]
})
export class DemoAHospitalDataModule {}
