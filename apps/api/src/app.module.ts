import { Module } from "@nestjs/common";


import { ExecutionModule }
from "./modules/execution/execution.module.js";


import { AssessmentModule }
from "./modules/assessment/assessment.module.js";


import { AssessmentSectionModule }
from "./modules/assessment-sections/assessment-section.module.js";


import { QuestionsModule }
from "./modules/questions/questions.module.js";


import { ScoringModule }
from "./modules/scoring/scoring.module.js";


import { DeliveryModule }
from "./modules/delivery/delivery.module.js";


import { AssessmentAttemptModule }
from "./modules/assessment-attempt/assessment-attempt.module.js";


@Module({

  imports: [

    ExecutionModule,


    AssessmentModule,


    AssessmentSectionModule,


    QuestionsModule,


    ScoringModule,


    DeliveryModule,


    AssessmentAttemptModule,

  ],

})
export class AppModule {}