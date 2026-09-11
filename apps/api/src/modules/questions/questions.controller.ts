import {
  Controller,
  Post,
  Body,
  Get,
  Param,
} from "@nestjs/common";


import {
  QuestionsService,
} from "./questions.service.js";


import {
  CreateCodingQuestionDto,
} from "./dto/create-coding-question.dto.js";



@Controller("questions")
export class QuestionsController {



  constructor(
    private readonly questionsService:
      QuestionsService,
  ) {}



  /*
  =====================================================
  CREATE CODING QUESTION

  POST:
  /questions/coding

  Flow:
  UI
   |
   ↓
  Controller
   |
   ↓
  QuestionsService
   |
   ↓
  Question
  CodingQuestion
  CodingTestCase
  AssessmentQuestion
  =====================================================
  */


  @Post("coding")
  async createCodingQuestion(

    @Body()
    dto: CreateCodingQuestionDto,

  ): Promise<any> {


    console.log(
      "CODING QUESTION REQUEST:",
      JSON.stringify(
        dto,
        null,
        2,
      ),
    );


    return this.questionsService
      .createCodingQuestion(
        dto,
      );

  }





  /*
  =====================================================
  GET QUESTIONS BY ASSESSMENT

  GET:
  /questions/assessment/:assessmentId


  Used by:

  apps/web/app/assessments/
  [assessmentId]/questions/page.tsx


  Fetches saved questions from DB
  =====================================================
  */


  @Get("assessment/:assessmentId")
  async getAssessmentQuestions(

    @Param("assessmentId")
    assessmentId: string,

  ): Promise<any> {


    console.log(
      "GET QUESTIONS FOR ASSESSMENT:",
      assessmentId,
    );


    return this.questionsService
      .getAssessmentQuestions(
        assessmentId,
      );

  }



}