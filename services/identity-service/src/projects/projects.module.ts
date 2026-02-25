import { Module } from "@nestjs/common";
import { ProjectsService } from "./projects.service.js";
import { ProjectsController } from "./projects.controller.js";

@Module({
  providers: [ProjectsService],
  controllers: [ProjectsController],
})
export class ProjectsModule {}
