import { Controller, Get, HttpException, HttpStatus, Query } from '@nestjs/common';
import { DemoAHospitalDataService } from './demo.a.hospital.data.service';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PaginationQueryDto } from 'src/common/pagination.core';

@Controller('demo-hosp-a-data')
export class DemoAHospitalDataController {
  constructor(
    private readonly demoAHospitalDataService: DemoAHospitalDataService,
  ) { }


  @ApiOperation({ summary: "Get patients from demo A hospital" })
  @ApiQuery({
    name: 'icd',
    description: "Disease code"
  })
  @Get('patients')
  async getPatients(
    @Query() pagination: PaginationQueryDto,
    @Query('icd') icd?: string,
  ){
    return await this.demoAHospitalDataService.getPatients(pagination, icd)
  }


  @ApiOperation({ summary: 'Get patient trial requirement count' })
  @ApiQuery({
    name: 'icd',
    type: 'string',
    description: 'ICD code',
  })
  @ApiQuery({
    name: 'minAge',
    type: 'number',
    description: 'Minimum age',
  })
  @ApiQuery({
    name: 'maxAge',
    type: 'number',
    description: 'Maximum age',
  })
  @Get('patient-ct-requirement-count')
  async getPatientTrialRequirementCount(
    @Query('icd') icd: string,
    @Query('minAge') minAge: number,
    @Query('maxAge') maxAge: number
  ) {
    if (!icd && !minAge && !maxAge) {
      throw new HttpException({ message: 'No parameters provided' }, HttpStatus.BAD_REQUEST)
    }
    return this.demoAHospitalDataService.getPatientTrialRequirementCount(icd, minAge, maxAge)
  }
}
