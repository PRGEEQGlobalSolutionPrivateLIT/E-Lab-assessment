import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
} from "@nestjs/common";

import { AssessmentService } from "./assessment.service.js";

import { AssessmentAttemptService } from "../assessment-attempt/assessment-attempt.service.js";

import { CreateAssessmentDto } from "./dto/create-assessment.dto.js";

import { UpdateAssessmentDto } from "./dto/update-assessment.dto.js";


@Controller("assessment")
export class AssessmentController {

  constructor(
    private readonly assessmentService:
      AssessmentService,

    private readonly assessmentAttemptService:
      AssessmentAttemptService,
  ) {}


  /*
  =====================================================
  CREATE ASSESSMENT

  POST
  /assessment
  =====================================================
  */

  @Post()
  async create(
    @Body()
    dto: CreateAssessmentDto,
  ) {

    return this.assessmentService.create(
      dto,
    );

  }


  /*
  =====================================================
  GET ALL ASSESSMENTS

  GET
  /assessment
  =====================================================
  */

  @Get()
  async findAll() {

    return this.assessmentService.findAll();

  }


  /*
  =====================================================
  GET ASSESSMENT RESULTS

  GET
  /assessment/:id/results

  IMPORTANT:
  This route must be ABOVE @Get(":id")
  so the results path is handled correctly.
  =====================================================
  */

  @Get(":id/results")
  async getAssessmentResults(
    @Param("id")
    id: string,
  ) {

    return this.assessmentAttemptService
      .getAssessmentResults(
        id,
      );

  }


  /*
  =====================================================
  GET SINGLE ASSESSMENT

  GET
  /assessment/:id
  =====================================================
  */

  @Get(":id")
  async findOne(
    @Param("id")
    id: string,
  ) {

    return this.assessmentService.findOne(
      id,
    );

  }


  /*
  =====================================================
  UPDATE ASSESSMENT

  PATCH
  /assessment/:id
  =====================================================
  */

  @Patch(":id")
  async update(
    @Param("id")
    id: string,

    @Body()
    dto: UpdateAssessmentDto,
  ) {

    return this.assessmentService.update(
      id,
      dto,
    );

  }


  /*
  =====================================================
  REVIEW COMPLETED

  PATCH
  /assessment/:id/complete
  =====================================================
  */

  @Patch(":id/complete")
  async completeAssessment(
    @Param("id")
    id: string,
  ) {

    return this.assessmentService.updateStatus(
      id,
      "COMPLETED",
    );

  }


  /*
  =====================================================
  PUBLISH ASSESSMENT

  PATCH
  /assessment/:id/publish
  =====================================================
  */

  @Patch(":id/publish")
  async publishAssessment(
    @Param("id")
    id: string,
  ) {

    return this.assessmentService.updateStatus(
      id,
      "PUBLISHED",
    );

  }

}