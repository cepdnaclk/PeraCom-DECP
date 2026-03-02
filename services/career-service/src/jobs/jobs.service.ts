import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Job, JobStatus, type JobDocument } from "./schemas/job.schema.js";
import { CreateJobDto } from "./dto/create-job.dto.js";
import { InjectMetric } from "@willsoto/nestjs-prometheus/dist/injector.js";
import type { Counter } from "prom-client";
import { publishEvent, type BaseEvent } from "@decp/event-bus";
import { v7 as uuidv7 } from "uuid";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";

@Injectable()
export class JobsService {
  constructor(
    @InjectModel(Job.name) private readonly jobModel: Model<JobDocument>,

    @InjectMetric("career_jobs_created_total")
    private jobCounter: Counter<string>,

    @InjectPinoLogger(JobsService.name)
    private readonly logger: PinoLogger,
  ) {}

  // =================================================
  // Create a Job (Defaults to DRAFT status)
  // =================================================
  async createJob(actorId: string, correlationId: string, dto: CreateJobDto) {
    // 1. Database Execution
    const createdJob = new this.jobModel({
      ...dto,
      postedBy: actorId,
      status: JobStatus.DRAFT, // Jobs must be explicitly published later
      applicationCount: 0,
    });

    const savedJob = await createdJob.save();

    // 2. If fails to create, an exception will be thrown and the following code won't execute
    if (!savedJob) {
      this.logger.error(
        { correlationId, actorId, jobData: dto },
        "Failed to create job",
      );
      throw new Error("Failed to create job");
    }

    // 3. Observability & Metrics
    this.jobCounter.inc({ status: JobStatus.DRAFT });

    // 4. Emit Kafka Event
    const jobCreatedEvent: BaseEvent<any> = {
      eventId: uuidv7(),
      eventType: "career.job.created",
      eventVersion: "1.0",
      timestamp: new Date().toISOString(),
      producer: "career-service",
      correlationId: correlationId,
      actorId: actorId,
      data: {
        jobId: savedJob._id.toString(),
        company: savedJob.companyName,
        status: savedJob.status,
      },
    };

    // 5. Fire and forget the event
    publishEvent("career.events", jobCreatedEvent).catch((err) => {
      this.logger.error(
        { err, correlationId, jobId: savedJob._id },
        "Failed to publish job created event",
      );
    });

    // 6. Return the created job
    return {
      message: "Job created successfully",
      jobId: savedJob._id.toString(),
    };
  }
}
