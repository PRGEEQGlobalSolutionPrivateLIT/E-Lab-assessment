import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from "@nestjs/common";

import {
  AssessmentAttemptService,
} from "./assessment-attempt.service.js";


@Controller("assessment-attempt")
export class AssessmentAttemptController {


  constructor(
    private readonly assessmentAttemptService:
      AssessmentAttemptService,
  ) {}


  /*
  =====================================================
  START ASSESSMENT
  =====================================================

  POST /assessment-attempt/start

  Body:

  {
    "assessmentId": "ASSESSMENT_ID",
    "learnerId": "LEARNER001"
  }
  */

  @Post("start")
  async startAssessment(
    @Body()
    body: {
      assessmentId: string;
      learnerId: string;
    },
  ) {

    return this.assessmentAttemptService
      .startAssessment(
        body.assessmentId,
        body.learnerId,
      );

  }


  /*
  =====================================================
  SAVE ANSWER
  =====================================================

  POST /assessment-attempt/:attemptId/answer

  Body:

  {
    "questionId": "QUESTION_ID",
    "sourceCode": "...",
    "language": "c"
  }
  */

  @Post(":attemptId/answer")
  async saveAnswer(

    @Param("attemptId")
    attemptId: string,

    @Body()
    body: {
      questionId: string;
      sourceCode: string;
      language: string;
    },

  ) {

    return this.assessmentAttemptService
      .saveAnswer(

        attemptId,

        body.questionId,

        body.sourceCode,

        body.language,

      );

  }


  /*
  =====================================================
  FINAL SUBMIT
  =====================================================

  POST /assessment-attempt/:attemptId/submit

  This completes the learner attempt.
  */

  @Post(":attemptId/submit")
  async submitAssessment(

    @Param("attemptId")
    attemptId: string,

  ) {

    return this.assessmentAttemptService
      .submitAssessment(
        attemptId,
      );

  }


  /*
  =====================================================
  GET RESULT
  =====================================================

  GET /assessment-attempt/:attemptId/result

  Used by the result page.
  */

  @Get(":attemptId/result")
  async getResult(

    @Param("attemptId")
    attemptId: string,

  ) {

    return this.assessmentAttemptService
      .getResult(
        attemptId,
      );

  }


  /*
  =====================================================
  GET CURRENT ATTEMPT
  =====================================================

  GET /assessment-attempt/:attemptId

  Used by the learner environment to recover the
  current attempt.
  */

  @Get(":attemptId")
  async getAttemptDetails(

    @Param("attemptId")
    attemptId: string,

  ) {

    return this.assessmentAttemptService
      .getAttemptDetails(
        attemptId,
      );

  }

}