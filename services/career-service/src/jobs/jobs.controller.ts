import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { JobsService } from "./jobs.service.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { ActorId } from "../auth/decorators/actor.decorator.js";
import { CorrelationId } from "../auth/decorators/correlation-id.decorator.js";
import { CreateJobDto } from "./dto/create-job.dto.js";

@Controller("jobs")
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  // POST /jobs
  @UseGuards(JwtAuthGuard)
  @Post()
  async createJob(
    @ActorId() actorId: string,
    @CorrelationId() correlationId: string,
    @Body() payload: CreateJobDto,
  ) {
    return this.jobsService.createJob(actorId, correlationId, payload);
  }
}
