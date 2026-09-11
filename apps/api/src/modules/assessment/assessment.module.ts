import { Module } from "@nestjs/common";

import { AssessmentController } from "./assessment.controller.js";

import { AssessmentService } from "./assessment.service.js";

import { AssessmentAttemptModule } from "../assessment-attempt/assessment-attempt.module.js";


@Module({
  imports: [
    AssessmentAttemptModule,
  ],

  controllers: [
    AssessmentController,
  ],

  providers: [
    AssessmentService,
  ],
})
export class AssessmentModule {}