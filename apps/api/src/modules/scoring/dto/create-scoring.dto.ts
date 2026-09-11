import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
} from "class-validator";


export class CreateScoringDto {


  @IsString()
  assessmentId!: string;



  @IsNumber()
  passPercentage!: number;



  @IsNumber()
  maximumAttempts!: number;



  @IsBoolean()
  negativeMarking!: boolean;



  @IsOptional()
  @IsNumber()
  negativeMarkValue?: number;



  @IsBoolean()
  partialMarking!: boolean;



  @IsBoolean()
  allowBackNavigation!: boolean;



  @IsBoolean()
  allowQuestionSkip!: boolean;



  @IsBoolean()
  autoSubmitOnTimeout!: boolean;


}