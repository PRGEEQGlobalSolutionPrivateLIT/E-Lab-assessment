import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { db } from "../../prisma/db.js";

import {
  CreateAssessmentSectionDto,
} from "./dto/create-section.dto.js";


@Injectable()
export class AssessmentSectionService {


  async create(
    dto: CreateAssessmentSectionDto,
  ): Promise<any> {

    console.log(
      "CREATE SECTION DTO:",
      dto,
    );


    const section =
      await db.orm.public.AssessmentSection.create({

        assessmentId:
          dto.assessmentId,

        title:
          dto.title,

        description:
          dto.description,

        sequence:
          dto.sequence,

      });


    console.log(
      "CREATED SECTION:",
      section,
    );


    return section;

  }


  async findByAssessment(
    assessmentId: string,
  ): Promise<any> {

    return db.orm.public.AssessmentSection
      .where({
        assessmentId,
      })
      .all();

  }


  async findOne(
    id: string,
  ): Promise<any> {

    const section =
      await db.orm.public.AssessmentSection
        .where({
          id,
        })
        .first();


    if (!section) {

      throw new NotFoundException(
        `Assessment Section with ID ${id} not found`,
      );

    }


    return section;

  }


  async update(
    id: string,
    dto: Partial<CreateAssessmentSectionDto>,
  ): Promise<any> {

    await this.findOne(id);


    return db.orm.public.AssessmentSection
      .where({
        id,
      })
      .update({

        ...(dto.title !== undefined && {
          title:
            dto.title,
        }),

        ...(dto.description !== undefined && {
          description:
            dto.description,
        }),

        ...(dto.sequence !== undefined && {
          sequence:
            dto.sequence,
        }),

      });

  }


}