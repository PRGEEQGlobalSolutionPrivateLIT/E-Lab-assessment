import {
  Controller,
  Post,
  Body,
  Get,
  Param,
} from "@nestjs/common";


import {
  ScoringService,
} from "./scoring.service.js";


import {
  CreateScoringDto,
} from "./dto/create-scoring.dto.js";



@Controller("scoring")
export class ScoringController {



  constructor(
    private readonly scoringService:
      ScoringService,
  ) {}





  /*
  =====================================================
  CREATE / UPDATE SCORING RULES

  POST:
  /scoring

  =====================================================
  */


  @Post()
  async createOrUpdate(

    @Body()
    dto: CreateScoringDto,

  ): Promise<any> {


    console.log(
      "SCORING DTO:",
      JSON.stringify(
        dto,
        null,
        2,
      ),
    );


    return await this.scoringService
      .createOrUpdate(
        dto,
      );

  }







  /*
  =====================================================
  GET SCORING RULES

  GET:
  /scoring/:assessmentId

  =====================================================
  */


  @Get(":assessmentId")
  async findByAssessment(

    @Param("assessmentId")
    assessmentId: string,

  ): Promise<any> {


    return await this.scoringService
      .findByAssessment(
        assessmentId,
      );

  }



}