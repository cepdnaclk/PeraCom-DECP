import {
  Controller,
  Post,
  Body,
  UseGuards,
  Patch,
  Param,
  Delete,
  Get,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { CorrelationId } from "../auth/decorators/correlation-id.decorator.js";
import { ActorId } from "../auth/decorators/actor.decorator.js";
import type { ProjectsService } from "./projects.service.js";
import type { ProjectDto } from "./dto/projects.dto.js";

@Controller("projects")
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  // POST /projects
  @UseGuards(JwtAuthGuard)
  @Post()
  createProject(
    @ActorId() actorId: string,
    @CorrelationId() correlationId: string,
    @Body() payload: ProjectDto,
  ) {
    return this.projectsService.createProject(actorId, correlationId, payload);
  }

  // PATCH /projects/:id
  @UseGuards(JwtAuthGuard)
  @Patch(":id")
  updateProject(
    @ActorId() actorId: string,
    @CorrelationId() correlationId: string,
    @Param("id") projectId: string,
    @Body() payload: Partial<ProjectDto>,
  ) {
    return this.projectsService.updateProject(
      actorId,
      correlationId,
      projectId,
      payload,
    );
  }

  // DELETE /projects/:id
  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  deleteProject(
    @ActorId() actorId: string,
    @CorrelationId() correlationId: string,
    @Param("id") projectId: string,
  ) {
    return this.projectsService.deleteProject(
      actorId,
      correlationId,
      projectId,
    );
  }

  // GET /projects
  @UseGuards(JwtAuthGuard)
  @Get()
  getAllProjects(
    @ActorId() actorId: string,
    @CorrelationId() correlationId: string,
  ) {
    return this.projectsService.viewProjects(actorId, correlationId);
  }
}
