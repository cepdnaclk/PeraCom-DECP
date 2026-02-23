import { Module } from "@nestjs/common";
import { PresenceService } from "./presence.service.js";
import { PresenceController } from "./presence.controller.js";

@Module({
  providers: [PresenceService],
  controllers: [PresenceController],
})
export class PresenceModule {}
