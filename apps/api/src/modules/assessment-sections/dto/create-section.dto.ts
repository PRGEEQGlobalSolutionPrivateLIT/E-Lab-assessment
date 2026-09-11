import {
  IsString,
  IsInt,
} from "class-validator";


export class CreateAssessmentSectionDto {


  @IsString()
  assessmentId!: string;


  @IsString()
  title!: string;


  @IsString()
  description!: string;


  @IsInt()
  sequence!: number;


}