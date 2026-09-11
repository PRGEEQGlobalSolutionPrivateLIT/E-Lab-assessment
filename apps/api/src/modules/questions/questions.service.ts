import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import {
  db,
} from "../../prisma/db.js";


@Injectable()
export class QuestionsService {


  /*
  =====================================================
  CREATE CODING QUESTION
  =====================================================
  */

  async createCodingQuestion(
    dto: any,
  ): Promise<any> {

    console.log(
      "CODING QUESTION DTO:",
      JSON.stringify(dto, null, 2),
    );


    /*
    ===================================================
    STEP 1
    CREATE BASE QUESTION
    ===================================================
    */

    const question =
      await db.orm.public.Question.create({

        organizationId:
          dto.organizationId,

        code:
          dto.form.code,

        title:
          dto.form.title,

        questionType:
          "CODING",

        difficulty:
          dto.form.difficulty,

        technology:
          dto.form.technology,

        bloomsLevel:
          dto.form.bloomsLevel,

        createdByUserId:
          dto.createdByUserId,

      });


    console.log(
      "QUESTION CREATED:",
      question.id,
    );


    /*
    ===================================================
    STEP 2
    CREATE CODING QUESTION DETAILS
    ===================================================
    */

    await db.orm.public.CodingQuestion.create({

      questionId:
        question.id,

      problemStatement:
        dto.form.problemStatement,

      inputFormat:
        dto.form.inputFormat,

      outputFormat:
        dto.form.outputFormat,

      constraintsText:
        dto.form.constraints,

      exampleInput:
        dto.form.exampleInput,

      exampleOutput:
        dto.form.exampleOutput,

      language:
        dto.form.language,

      starterCode:
        dto.form.starterCode,

      referenceSolution:
        dto.form.referenceSolution,

      compiler:
        dto.form.compiler,

      languageStandard:
        dto.form.languageStandard,

      timeLimitSeconds:
        dto.form.timeLimitSeconds ?? 2,

      memoryLimitMb:
        dto.form.memoryLimitMb ?? 256,

      aiPolicy:
        dto.form.aiPolicy ?? "DISABLED",

    });


    /*
    ===================================================
    STEP 3
    CREATE CODING TEST CASES
    ===================================================
    */

    for (
      const tc of (dto.testCases ?? [])
    ) {

      await db.orm.public.CodingTestCase.create({

        questionId:
          question.id,

        name:
          tc.name,

        testType:
          tc.type,

        inputData:
          tc.input,

        expectedOutput:
          tc.expectedOutput,

        marks:
          tc.marks ?? 0,

        sequence:
          tc.sequence ?? 1,

        isActive:
          tc.active ?? true,

      });

    }


    /*
    ===================================================
    STEP 4
    LINK QUESTION TO ASSESSMENT
    ===================================================
    */

    await db.orm.public.AssessmentQuestion.create({

      assessmentId:
        dto.assessmentId,

      questionId:
        question.id,

      sectionId:
        dto.sectionId ?? null,

      sequence:
        dto.sequence ?? 1,

      marks:
        dto.form.marks ?? 0,

      mandatory:
        true,

    });


    /*
    ===================================================
    RETURN CREATED QUESTION
    ===================================================
    */

    return question;

  }


  /*
  =====================================================
  GET QUESTIONS BY ASSESSMENT
  =====================================================

  This endpoint now returns:

  AssessmentQuestion
       +
  Question
       +
  CodingQuestion
       +
  CodingTestCase[]

  This is what the learner test environment needs.
  =====================================================
  */

  async getAssessmentQuestions(
    assessmentId: string,
  ): Promise<any[]> {


    /*
    ===================================================
    STEP 1
    GET ASSESSMENT QUESTION MAPPINGS
    ===================================================
    */

    const mappings =
      await db.orm.public.AssessmentQuestion
        .where({

          assessmentId,

        })
        .all();


    if (
      !mappings ||
      mappings.length === 0
    ) {

      return [];

    }


    /*
    ===================================================
    STEP 2
    LOAD COMPLETE QUESTION DATA
    ===================================================
    */

    const result: any[] = [];


    for (
      const mapping of mappings
    ) {


      /*
      -----------------------------------------------
      GET BASE QUESTION
      -----------------------------------------------
      */

      const question =
        await db.orm.public.Question
          .where({

            id:
              mapping.questionId,

          })
          .first();


      /*
      If question was deleted but mapping remains,
      skip it instead of breaking the whole assessment.
      */

      if (!question) {

        console.warn(
          "Question not found for assessment mapping:",
          mapping.questionId,
        );

        continue;

      }


      /*
      -----------------------------------------------
      GET CODING QUESTION DETAILS
      -----------------------------------------------
      */

      const codingQuestion =
        await db.orm.public.CodingQuestion
          .where({

            questionId:
              question.id,

          })
          .first();


      /*
      -----------------------------------------------
      GET CODING TEST CASES
      -----------------------------------------------
      */

      const testCases =
        await db.orm.public.CodingTestCase
          .where({

            questionId:
              question.id,

          })
          .all();


      /*
      -----------------------------------------------
      SORT TEST CASES
      -----------------------------------------------
      */

      const sortedTestCases =
        [...testCases].sort(
          (
            a: any,
            b: any,
          ) =>
            Number(
              a.sequence ?? 0,
            ) -
            Number(
              b.sequence ?? 0,
            ),
        );


      /*
      =================================================
      COMPLETE LEARNER QUESTION OBJECT
      =================================================
      */

      result.push({

        /*
        -----------------------------------------------
        ASSESSMENT MAPPING
        -----------------------------------------------
        */

        id:
          mapping.id,

        questionId:
          mapping.questionId,

        assessmentId:
          mapping.assessmentId,

        sectionId:
          mapping.sectionId ?? null,

        sequence:
          mapping.sequence ?? 1,

        marks:
          mapping.marks ?? 0,

        mandatory:
          mapping.mandatory ?? true,


        /*
        -----------------------------------------------
        BASE QUESTION
        -----------------------------------------------
        */

        title:
          question.title,

        code:
          question.code,

        type:
          question.questionType,

        difficulty:
          question.difficulty,

        technology:
          question.technology,

        bloomsLevel:
          question.bloomsLevel,


        /*
        -----------------------------------------------
        CODING QUESTION
        -----------------------------------------------
        */

        problemStatement:
          codingQuestion?.problemStatement ??
          "",

        inputFormat:
          codingQuestion?.inputFormat ??
          "",

        outputFormat:
          codingQuestion?.outputFormat ??
          "",

        constraints:
          codingQuestion?.constraintsText ??
          "",

        exampleInput:
          codingQuestion?.exampleInput ??
          "",

        exampleOutput:
          codingQuestion?.exampleOutput ??
          "",

        language:
          codingQuestion?.language ??
          question.technology ??
          "C",

        starterCode:
          codingQuestion?.starterCode ??
          "",

        /*
        IMPORTANT:
        Do NOT expose referenceSolution
        to the learner.
        */

        compiler:
          codingQuestion?.compiler ??
          "",

        languageStandard:
          codingQuestion?.languageStandard ??
          "",

        timeLimitSeconds:
          codingQuestion?.timeLimitSeconds ??
          0,

        memoryLimitMb:
          codingQuestion?.memoryLimitMb ??
          0,

        aiPolicy:
          codingQuestion?.aiPolicy ??
          "DISABLED",


        /*
        -----------------------------------------------
        TEST CASES
        -----------------------------------------------

        We intentionally do not expose the expected
        output for hidden test cases to the learner.
        */

        testCases:
          sortedTestCases.map(
            (testCase: any) => {

              const isPublic =
                String(
                  testCase.testType ??
                  "",
                ).toUpperCase() ===
                "SAMPLE";


              return {

                id:
                  testCase.id,

                name:
                  testCase.name,

                type:
                  testCase.testType,

                input:
                  testCase.inputData,

                /*
                Expected output is only returned
                for public/sample test cases.
                */

                expectedOutput:
                  isPublic
                    ? testCase.expectedOutput
                    : "",

                marks:
                  testCase.marks ?? 0,

                sequence:
                  testCase.sequence ?? 1,

                active:
                  testCase.isActive ?? true,

              };

            },
          ),

      });

    }


    /*
    ===================================================
    STEP 3
    SORT QUESTIONS BY SEQUENCE
    ===================================================
    */

    result.sort(
      (
        a,
        b,
      ) =>
        Number(
          a.sequence ?? 0,
        ) -
        Number(
          b.sequence ?? 0,
        ),
    );


    /*
    ===================================================
    DEBUG LOG
    ===================================================
    */

    console.log(
      "ASSESSMENT QUESTIONS LOADED:",
      JSON.stringify(
        result,
        null,
        2,
      ),
    );


    return result;

  }

}