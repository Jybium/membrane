import {IsNotEmpty, IsString } from "class-validator";

export class IndexClinicalTrialDto {
  @IsNotEmpty()
  @IsString()
  trialHexId: string

  @IsNotEmpty()
  @IsString()
  diseaseCode: string
}