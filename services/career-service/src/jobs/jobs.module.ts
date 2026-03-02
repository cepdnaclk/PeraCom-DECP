import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { makeCounterProvider } from "@willsoto/nestjs-prometheus";
import { Job, JobSchema } from "./schemas/job.schema.js";
import { JobsController } from "./jobs.controller.js";
import { JobsService } from "./jobs.service.js";

@Module({
  imports: [MongooseModule.forFeature([{ name: Job.name, schema: JobSchema }])],
  controllers: [JobsController],
  providers: [
    JobsService,
    makeCounterProvider({
      name: "career_jobs_created_total",
      help: "Total number of jobs created",
    }),
  ],
})
export class JobsModule {}
