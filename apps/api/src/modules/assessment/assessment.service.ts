import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";


import { db } from "../../prisma/db.js";


import { CreateAssessmentDto } from "./dto/create-assessment.dto.js";


import { UpdateAssessmentDto } from "./dto/update-assessment.dto.js";




@Injectable()
export class AssessmentService {





  /*
  =====================================================
  CREATE ASSESSMENT

  Default Status:

  DRAFT

  =====================================================
  */


  async create(
    dto: CreateAssessmentDto
  ): Promise<any> {


    console.log(
      "CREATE ASSESSMENT DTO:",
      dto,
    );



    const assessment =
      await db.orm.public.Assessment.create({



        organizationId:
          dto.organizationId,



        title:
          dto.title,



        code:
          dto.code,



        assessmentType:
          dto.assessmentType,



        description:
          dto.description,



        instructions:
          dto.instructions,



        technology:
          dto.technology,



        difficulty:
          dto.difficulty,



        plannedQuestions:
          dto.plannedQuestions,



        totalMarks:
          dto.totalMarks,



        durationMinutes:
          dto.durationMinutes,



        /*
        Initial lifecycle status
        */
        status:
          "DRAFT",



        builderStep:
          "SETUP",



        currentVersion:
          1,



        createdByUserId:
          dto.createdByUserId,


      });



    console.log(
      "CREATED ASSESSMENT:",
      assessment,
    );



    return assessment;


  }








  /*
  =====================================================
  GET ALL ASSESSMENTS

  Used for:

  Draft
  Completed
  Published

  =====================================================
  */


  async findAll(): Promise<any> {


    return db.orm.public.Assessment.all();


  }








  /*
  =====================================================
  GET SINGLE ASSESSMENT

  =====================================================
  */


  async findOne(
    id:string
  ): Promise<any> {



    const assessment =
      await db.orm.public.Assessment
        .where({

          id,

        })
        .first();





    if(!assessment){


      throw new NotFoundException(

        `Assessment with ID ${id} not found`

      );


    }




    return assessment;


  }








  /*
  =====================================================
  UPDATE ASSESSMENT

  General updates

  =====================================================
  */


  async update(

    id:string,

    dto:UpdateAssessmentDto,

  ): Promise<any>{



    await this.findOne(id);




    return await db.orm.public.Assessment

      .where({

        id,

      })

      .update({





        ...(dto.title !== undefined && {

          title:
            dto.title,

        }),





        ...(dto.code !== undefined && {

          code:
            dto.code,

        }),





        ...(dto.assessmentType !== undefined && {

          assessmentType:
            dto.assessmentType,

        }),





        ...(dto.description !== undefined && {

          description:
            dto.description,

        }),





        ...(dto.instructions !== undefined && {

          instructions:
            dto.instructions,

        }),





        ...(dto.technology !== undefined && {

          technology:
            dto.technology,

        }),





        ...(dto.difficulty !== undefined && {

          difficulty:
            dto.difficulty,

        }),





        ...(dto.plannedQuestions !== undefined && {

          plannedQuestions:
            dto.plannedQuestions,

        }),





        ...(dto.totalMarks !== undefined && {

          totalMarks:
            dto.totalMarks,

        }),





        ...(dto.durationMinutes !== undefined && {

          durationMinutes:
            dto.durationMinutes,

        }),





        ...(dto.builderStep !== undefined && {


          builderStep:
            dto.builderStep as

              | "SETUP"

              | "QUESTIONS"

              | "SCORING"

              | "DELIVERY"

              | "REVIEW"

              | "PUBLISH",


        }),





        ...(dto.updatedByUserId !== undefined && {


          updatedByUserId:
            dto.updatedByUserId,


        }),





      });



  }









  /*
  =====================================================
  UPDATE STATUS

  Lifecycle:

  DRAFT
      |
      |
  COMPLETED
      |
      |
  PUBLISHED


  Used by:

  PATCH /assessment/:id/complete

  PATCH /assessment/:id/publish

  =====================================================
  */


  async updateStatus(

    id:string,

    status:
      "DRAFT"
      |
      "COMPLETED"
      |
      "PUBLISHED",

  ): Promise<any>{





    await this.findOne(id);





    console.log(

      "UPDATING ASSESSMENT STATUS:",

      {

        id,

        status,

      },

    );





    return await db.orm.public.Assessment

      .where({

        id,

      })

      .update({


        status,


      });



  }





}