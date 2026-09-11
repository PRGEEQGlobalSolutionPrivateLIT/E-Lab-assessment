import { Module } from "@nestjs/common";


import { AssessmentSectionController }
from "./assessment-section.controller.js";


import { AssessmentSectionService }
from "./assessment-section.service.js";



@Module({

controllers:[
 AssessmentSectionController,
],


providers:[
 AssessmentSectionService,
],


})
export class AssessmentSectionModule {}