import {
  IsString,
  IsBoolean,
  IsOptional,
  IsNumber,
} from "class-validator";



export class CreateDeliveryDto {



  @IsString()
  assessmentId!: string;



  @IsOptional()
  @IsString()
  startDate?: string;



  @IsOptional()
  @IsString()
  startTime?: string;



  @IsOptional()
  @IsString()
  endDate?: string;



  @IsOptional()
  @IsString()
  endTime?: string;





  @IsString()
  audienceType!: string;



  @IsOptional()
  @IsString()
  batchOrGroup?: string;



  @IsOptional()
  @IsString()
  selectedLearners?: string;





  @IsOptional()
  @IsString()
  aiPolicy?: string;







  @IsOptional()
  @IsBoolean()
  fullscreenMode?: boolean;



  @IsOptional()
  @IsBoolean()
  tabSwitchDetection?: boolean;



  @IsOptional()
  @IsBoolean()
  copyPasteDetection?: boolean;



  @IsOptional()
  @IsBoolean()
  copyPasteRestriction?: boolean;




  @IsOptional()
  @IsBoolean()
  textSelectionDetection?: boolean;



  @IsOptional()
  @IsBoolean()
  textSelectionRestriction?: boolean;




  @IsOptional()
  @IsBoolean()
  autoSubmitOnViolation?: boolean;





  @IsOptional()
  @IsNumber()
  maximumTabSwitches?: number;




  @IsOptional()
  @IsNumber()
  violationLimit?: number;






  @IsOptional()
  @IsString()
  allowedIpAddresses?: string;






  @IsOptional()
  @IsString()
  devicePolicy?: string;






  @IsOptional()
  @IsBoolean()
  cameraProctoring?: boolean;



  @IsOptional()
  @IsBoolean()
  microphoneMonitoring?: boolean;



  @IsOptional()
  @IsBoolean()
  identityVerification?: boolean;





  @IsOptional()
  @IsBoolean()
  blockBrowserExtensions?: boolean;



  @IsOptional()
  @IsBoolean()
  disableRightClick?: boolean;



  @IsOptional()
  @IsBoolean()
  preventPrinting?: boolean;



  @IsOptional()
  @IsBoolean()
  preventScreenshots?: boolean;



}