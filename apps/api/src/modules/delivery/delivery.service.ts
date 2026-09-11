import {
  Injectable,
} from "@nestjs/common";


import {
  db,
} from "../../prisma/db.js";



@Injectable()
export class DeliveryService {



  /*
  =====================================================
  CREATE / UPDATE DELIVERY CONFIGURATION
  =====================================================
  */


  async createOrUpdate(
    dto:any
  ): Promise<any> {



    try {



      console.log(
        "DELIVERY SAVE DTO:",
        JSON.stringify(
          dto,
          null,
          2
        )
      );





      /*
      ============================================
      DELIVERY TABLE DATA
      ============================================
      */


      const startsAt =

        dto.startDate &&
        dto.startTime

        ?

        `${dto.startDate}T${dto.startTime}:00`

        :

        null;




      const endsAt =

        dto.endDate &&
        dto.endTime

        ?

        `${dto.endDate}T${dto.endTime}:00`

        :

        null;






      const deliveryData = {


        assessmentId:
          dto.assessmentId,



        startsAt,


        endsAt,



        audienceType:

          dto.audienceType
          ??
          "ALL_LEARNERS",



        batchOrGroup:

          dto.batchOrGroup
          ??
          null,



        selectedLearners:

          dto.selectedLearners
          ??
          null,



        aiPolicy:

          dto.aiPolicy
          ??
          "DISABLED",



      };






      console.log(
        "DELIVERY TABLE DATA:",
        JSON.stringify(
          deliveryData,
          null,
          2
        )
      );






      const existingDelivery =

        await db.orm.public.AssessmentDelivery

        .where({

          assessmentId:
            dto.assessmentId,

        })

        .first();






      let deliveryResult:any;





      if(existingDelivery){



        console.log(
          "Updating AssessmentDelivery"
        );



        deliveryResult =

          await db.orm.public.AssessmentDelivery

          .where({

            assessmentId:
              dto.assessmentId,

          })

          .update({



            startsAt,


            endsAt,



            audienceType:
              deliveryData.audienceType,



            batchOrGroup:
              deliveryData.batchOrGroup,



            selectedLearners:
              deliveryData.selectedLearners,



            aiPolicy:
              deliveryData.aiPolicy,



          });




      }
      else{



        console.log(
          "Creating AssessmentDelivery"
        );



        deliveryResult =

          await db.orm.public.AssessmentDelivery

          .create(

            deliveryData

          );



      }









      /*
      ============================================
      SECURITY POLICY TABLE DATA
      ============================================
      */


      const securityData = {



        fullscreenMode:

          Boolean(
            dto.fullscreenMode
          ),



        tabSwitchDetection:

          Boolean(
            dto.tabSwitchDetection
          ),



        copyPasteDetection:

          Boolean(
            dto.copyPasteDetection
          ),



        copyPasteRestriction:

          Boolean(
            dto.copyPasteRestriction
          ),



        textSelectionDetection:

          Boolean(
            dto.textSelectionDetection
          ),



        textSelectionRestriction:

          Boolean(
            dto.textSelectionRestriction
          ),



        autoSubmitOnViolation:

          Boolean(
            dto.autoSubmitOnViolation
          ),




        maximumTabSwitches:

          Number(
            dto.maximumTabSwitches ?? 3
          ),




        violationLimit:

          Number(
            dto.violationLimit ?? 3
          ),




        devicePolicy:

          dto.devicePolicy
          ??
          "ANY",




        cameraProctoring:

          Boolean(
            dto.cameraProctoring
          ),



        microphoneMonitoring:

          Boolean(
            dto.microphoneMonitoring
          ),



        identityVerification:

          Boolean(
            dto.identityVerification
          ),



        blockBrowserExtensions:

          Boolean(
            dto.blockBrowserExtensions
          ),



        disableRightClick:

          Boolean(
            dto.disableRightClick
          ),



        preventPrinting:

          Boolean(
            dto.preventPrinting
          ),



        preventScreenshots:

          Boolean(
            dto.preventScreenshots
          ),


      };






      console.log(
        "SECURITY POLICY DATA:",
        JSON.stringify(
          securityData,
          null,
          2
        )
      );







      const existingSecurity =

        await db.orm.public.AssessmentSecurityPolicy

        .where({

          assessmentId:
            dto.assessmentId,

        })

        .first();







      if(existingSecurity){



        console.log(
          "Updating Security Policy"
        );



        await db.orm.public.AssessmentSecurityPolicy

        .where({

          assessmentId:
            dto.assessmentId,

        })

        .update(

          securityData

        );




      }
      else{



        console.log(
          "Creating Security Policy"
        );



        await db.orm.public.AssessmentSecurityPolicy

        .create({


          assessmentId:
            dto.assessmentId,


          ...securityData


        });



      }








      return {


        success:true,


        delivery:
          deliveryResult,


      };




    }

    catch(error){



      console.error(

        "DELIVERY DATABASE ERROR:",

        error

      );



      throw error;



    }



  }








  /*
  =====================================================
  GET DELIVERY CONFIGURATION
  =====================================================
  */


  async findByAssessment(

    assessmentId:string

  ): Promise<any> {



    try {



      const delivery =

        await db.orm.public.AssessmentDelivery

        .where({

          assessmentId,

        })

        .first();






      const security =

        await db.orm.public.AssessmentSecurityPolicy

        .where({

          assessmentId,

        })

        .first();







      return {


        delivery:

          delivery
          ??
          null,



        security:

          security
          ??
          null,



      };




    }

    catch(error){



      console.error(

        "GET DELIVERY ERROR:",

        error

      );



      throw error;



    }



  }



}