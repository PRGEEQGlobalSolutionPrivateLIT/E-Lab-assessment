import { Module } from "@nestjs/common";

import {
  AssessmentAttemptController,
} from "./assessment-attempt.controller.js";

import {
  AssessmentAttemptService,
} from "./assessment-attempt.service.js";


@Module({

  controllers: [
    AssessmentAttemptController,
  ],

  providers: [
    AssessmentAttemptService,
  ],

  exports: [
    AssessmentAttemptService,
  ],

})
export class AssessmentAttemptModule {}