import {
  Controller,
  Post,
  Body,
  Get,
  Param,
} from "@nestjs/common";


import {
  DeliveryService,
} from "./delivery.service.js";


import {
  CreateDeliveryDto,
} from "./dto/create-delivery.dto.js";



@Controller("delivery")
export class DeliveryController {


constructor(
 private readonly deliveryService:DeliveryService
){}





@Post()
async createOrUpdate(

 @Body()
 dto:CreateDeliveryDto

): Promise<any> {


 return await this.deliveryService
 .createOrUpdate(dto);


}






@Get(":assessmentId")
async find(

 @Param("assessmentId")
 assessmentId:string

): Promise<any> {


 return await this.deliveryService
 .findByAssessment(
   assessmentId
 );


}



}