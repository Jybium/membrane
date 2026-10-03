import {IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class IndexClinicalTrialDto {
  @ApiProperty({
    description: "The hex string of the clinical trial to look up on the Membrane contract",
    example: "jddjdjdjdjddddddddddddppppppppppeen"
  })
  @IsNotEmpty()
  @IsString()
  trialHexId: string

  @ApiProperty({
    description: "The ICD disease code of the clinical trial",
    example: "K30"
  })
  @IsNotEmpty()
  @IsString()
  diseaseCode: string
}