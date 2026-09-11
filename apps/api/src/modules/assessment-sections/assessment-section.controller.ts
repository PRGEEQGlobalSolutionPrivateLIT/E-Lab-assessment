import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
} from "@nestjs/common";

import {
  AssessmentSectionService,
} from "./assessment-section.service.js";

import {
  CreateAssessmentSectionDto,
} from "./dto/create-section.dto.js";


@Controller("assessment-sections")
export class AssessmentSectionController {


  constructor(
    private readonly assessmentSectionService:
      AssessmentSectionService,
  ) {}



  /*
   * Step 2:
   * Create assessment section
   *
   * Called from:
   * Structure page
   *
   * POST /assessment-sections
   */
  @Post()
  async create(
    @Body()
    dto: CreateAssessmentSectionDto,
  ) {

    return this.assessmentSectionService.create(
      dto,
    );

  }




  /*
   * Get all sections for an assessment
   *
   * Used when loading Step 2 again
   *
   * GET /assessment-sections/assessment/:assessmentId
   */
  @Get("assessment/:assessmentId")
  async findByAssessment(
    @Param("assessmentId")
    assessmentId: string,
  ) {

    return this.assessmentSectionService.findByAssessment(
      assessmentId,
    );

  }




  /*
   * Get single section
   *
   * GET /assessment-sections/:id
   */
  @Get(":id")
  async findOne(
    @Param("id")
    id: string,
  ) {

    return this.assessmentSectionService.findOne(
      id,
    );

  }




  /*
   * Update section
   *
   * PATCH /assessment-sections/:id
   */
  @Patch(":id")
  async update(
    @Param("id")
    id: string,

    @Body()
    dto: Partial<CreateAssessmentSectionDto>,
  ) {

    return this.assessmentSectionService.update(
      id,
      dto,
    );

  }


}