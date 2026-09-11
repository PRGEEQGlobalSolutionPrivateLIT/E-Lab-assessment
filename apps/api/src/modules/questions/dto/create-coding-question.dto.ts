import {
 IsString,
 IsArray,
 IsOptional,
 IsObject,
} from "class-validator";


export class CreateCodingQuestionDto {


 @IsString()
 assessmentId!: string;



 @IsOptional()
 @IsString()
 sectionId?: string;



 @IsString()
 organizationId!: string;



 @IsString()
 createdByUserId!: string;



 @IsObject()
 form!: Record<string, any>;



 @IsArray()
 testCases!: any[];

}