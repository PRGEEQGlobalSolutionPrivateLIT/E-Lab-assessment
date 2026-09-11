import {
  Injectable,
} from "@nestjs/common";


import {
  db,
} from "../../prisma/db.js";



@Injectable()
export class ScoringService {



  /*
  =====================================================
  CREATE / UPDATE SCORING RULES

  POST /scoring
  =====================================================
  */


  async createOrUpdate(
    dto:any
  ): Promise<any> {


    try {


      console.log(
        "SAVE SCORING SERVICE:",
        JSON.stringify(
          dto,
          null,
          2,
        ),
      );





      const existing =
        await db.orm.public.AssessmentScoringRule
        .where({

          assessmentId:
            dto.assessmentId,

        })
        .first();







      if(existing){


        console.log(
          "Updating existing scoring rule"
        );



        const updated =
          await db.orm.public.AssessmentScoringRule
          .where({

            assessmentId:
              dto.assessmentId,

          })
          .update({

            passPercentage:
              Number(
                dto.passPercentage
              ),


            maximumAttempts:
              Number(
                dto.maximumAttempts
              ),


            negativeMarking:
              Boolean(
                dto.negativeMarking
              ),


            negativeMarkValue:
              dto.negativeMarking
              ?
              Number(
                dto.negativeMarkValue
              )
              :
              null,



            partialMarking:
              Boolean(
                dto.partialMarking
              ),



            allowBackNavigation:
              Boolean(
                dto.allowBackNavigation
              ),



            allowQuestionSkip:
              Boolean(
                dto.allowQuestionSkip
              ),



            autoSubmitOnTimeout:
              Boolean(
                dto.autoSubmitOnTimeout
              ),

          });



        return updated;


      }








      console.log(
        "Creating new scoring rule"
      );



      const created =
        await db.orm.public.AssessmentScoringRule
        .create({

          assessmentId:
            dto.assessmentId,



          passPercentage:
            Number(
              dto.passPercentage
            ),



          maximumAttempts:
            Number(
              dto.maximumAttempts
            ),



          negativeMarking:
            Boolean(
              dto.negativeMarking
            ),



          negativeMarkValue:
            dto.negativeMarking
            ?
            Number(
              dto.negativeMarkValue
            )
            :
            null,



          partialMarking:
            Boolean(
              dto.partialMarking
            ),



          allowBackNavigation:
            Boolean(
              dto.allowBackNavigation
            ),



          allowQuestionSkip:
            Boolean(
              dto.allowQuestionSkip
            ),



          autoSubmitOnTimeout:
            Boolean(
              dto.autoSubmitOnTimeout
            ),

        });



      return created;



    }
    catch(error){


      console.error(
        "SCORING SAVE ERROR:",
        error,
      );


      throw error;


    }


  }








  /*
  =====================================================
  GET SCORING RULES BY ASSESSMENT

  GET /scoring/:assessmentId

  =====================================================
  */


  async findByAssessment(
    assessmentId:string
  ): Promise<any> {



    try {



      const scoring =
        await db.orm.public.AssessmentScoringRule
        .where({

          assessmentId,

        })
        .first();







      /*
      No scoring saved yet.
      Return default values so UI can load.
      */


      if(!scoring){


        return {

          assessmentId,


          passPercentage:50,


          maximumAttempts:1,


          negativeMarking:false,


          negativeMarkValue:null,


          partialMarking:true,


          allowBackNavigation:true,


          allowQuestionSkip:true,


          autoSubmitOnTimeout:true,


        };


      }






      return scoring;



    }
    catch(error){


      console.error(
        "GET SCORING ERROR:",
        error,
      );


      throw error;


    }



  }




}