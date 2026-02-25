import { Module } from "@nestjs/common";
import { SocialService } from "./social.service.js";
import { SocialController } from "./social.controller.js";

@Module({
  providers: [SocialService],
  controllers: [SocialController],
})
export class SocialModule {}
