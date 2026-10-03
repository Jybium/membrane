import { Injectable, OnApplicationBootstrap, Inject, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository, Between } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { DemoAHospitalConsentedPatients } from './entities/consented.patients.entity';
import type { LoggerService } from '@nestjs/common'; 
import { PaginatedResult, PaginationQueryDto } from 'src/common/pagination.core';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { randomUUID } from 'crypto';


const DISEASE_CODES = [
  'E11', 'E10', 'I10', 'I21', 'I25', 'I50', 'I48', 'I63', 'J45', 'J44',
  'J18', 'J20', 'K21', 'K29', 'K80', 'K59', 'C34', 'C50', 'C61', 'C18',
  'D50', 'D64', 'N18', 'N39', 'N40', 'M54', 'M17', 'M19', 'M81', 'G43',
  'G40', 'G20', 'F32', 'F41', 'F03', 'E03', 'E05', 'E66', 'E78', 'L40',
  'L20', 'H25', 'H40', 'H66', 'B20', 'B18', 'A15', 'Q21', 'O14', 'S72',
]

export const FIRST_NAMES = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
  'Kenneth', 'Carol', 'Kevin', 'Amanda', 'Brian', 'Dorothy', 'George', 'Melissa',
  'Edward', 'Deborah', 'Ronald', 'Stephanie', 'Timothy', 'Rebecca', 'Jason', 'Sharon',
  'Jeffrey', 'Laura', 'Ryan', 'Cynthia', 'Jacob', 'Kathleen', 'Gary', 'Amy',
  'Nicholas', 'Angela', 'Eric', 'Shirley', 'Jonathan', 'Anna', 'Stephen', 'Brenda',
  'Larry', 'Pamela', 'Justin', 'Emma', 'Scott', 'Nicole', 'Brandon', 'Helen',
  'Benjamin', 'Samantha', 'Samuel', 'Katherine', 'Gregory', 'Christine', 'Alexander', 'Debra',
  'Frank', 'Rachel',
]


export const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
  'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
  'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker',
  'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy',
  'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey',
  'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
  'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza',
  'Ruiz', 'Hughes',
]


@Injectable()
export class DemoAHospitalDataService implements OnApplicationBootstrap {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private logger: LoggerService,
    @InjectRepository(DemoAHospitalConsentedPatients)
    private readonly consentedPatientsRepo: Repository<DemoAHospitalConsentedPatients>,
  ){}


  async onApplicationBootstrap() {
    const count = Number(process.env.SEED_PATIENT_COUNT ?? 200)
    await this.generateConsentedPatients(count)
  }


  private randomItem<T>(arr: readonly T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
  }

  private randomAge(min = 1, max = 90): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  async generateConsentedPatients(count: number){
    const existingCount = await this.consentedPatientsRepo.count()

    if (existingCount > 0) {
      this.logger.log(`Skipping seed - ${existingCount} consented patients already exist.`)
      return
    }
  
    const patients: DemoAHospitalConsentedPatients[] = [];

    for (let i = 0; i < count; i++) {
      const patient = this.consentedPatientsRepo.create({
        id: randomUUID(),
        patientId: randomUUID(),
        firstName: this.randomItem(FIRST_NAMES),
        lastName: this.randomItem(LAST_NAMES),
        age: this.randomAge(),
        diseaseCode: this.randomItem(DISEASE_CODES),
      })
      patients.push(patient)
    }

    await this.consentedPatientsRepo.save(patients)
    this.logger.log(`Seeding success - ${count} consented patients created.`)
  }

  

  // this gets the count of patients from the demo hospital data,
  // based on the requirement of a clinical trial
  async getPatientTrialRequirementCount(diseaseCode: string, minAge: number, maxAge: number){
    try {
      const patientsCount = await this.consentedPatientsRepo.count({
        where:{
          diseaseCode,
          age: Between(minAge, maxAge)
        }
      })
      return {
        patientsCount: patientsCount
      }
    } catch (error) {
      this.logger.error(`Error get patient trial requirement count for demo A hospital: ${error.message}`, DemoAHospitalDataService.name)
      throw new InternalServerErrorException(`Error get patient trial requirement count for demo A hospital`)
    }
  }
}
