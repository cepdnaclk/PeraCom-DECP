import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Post, type PostDocument } from "./schemas/post.schema.js";
import { CreatePostDto } from "./dto/create-post.dto.js";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Counter } from "prom-client";
import { v7 as uuidv7 } from "uuid";
import { publishEvent, type BaseEvent } from "@decp/event-bus";
import { MinioService } from "../minio/minio.service.js";

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name)
    private postModel: Model<PostDocument>,

    private readonly minioService: MinioService,

    @InjectMetric("engagement_posts_created_total")
    private postCounter: Counter<string>,
  ) {}

  async createPost(
    userId: string,
    correlationId: string,
    dto: CreatePostDto,
    files: Express.Multer.File[] = [],
  ) {
    // 1. Validate media attachments
    let images: string[] = [];
    let video: string | null = null;

    // 2. Enforce media rules
    const imageFiles = files.filter((file) =>
      file.mimetype.startsWith("image/"),
    );

    const videoFiles = files.filter((file) =>
      file.mimetype.startsWith("video/"),
    );

    // 3. Enforce rules
    // Rule 1: Cannot have both
    if (imageFiles.length > 0 && videoFiles.length > 0) {
      throw new BadRequestException("Cannot upload both images and video");
    }

    // Rule 2: Max 10 images
    if (imageFiles.length > 10) {
      throw new BadRequestException("Maximum 10 images allowed");
    }

    // Rule 3: Max 1 video
    if (videoFiles.length > 1) {
      throw new BadRequestException("Only 1 video allowed");
    }

    // 4. Upload images
    for (const file of imageFiles) {
      const objectName = `posts/${Date.now()}-${file.originalname}`;
      const url = await this.minioService.uploadFile(
        "posts-bucket",
        objectName,
        file.buffer,
        file.mimetype,
      );
      images.push(url);
    }

    // 5. Upload video
    if (videoFiles.length === 1) {
      const file = videoFiles[0];
      if (!file) {
        throw new BadRequestException("Invalid video file");
      }

      const objectName = `posts/${Date.now()}-${file.originalname}`;
      video = await this.minioService.uploadFile(
        "posts-bucket",
        objectName,
        file.buffer,
        file.mimetype,
      );
    }

    // 6. Create post document
    const createdPost = new this.postModel({
      ...dto,
      images,
      video,
      authorId: userId,
    });

    // 7. Save to database
    const savedPost = await createdPost.save();

    // 8. Increment Prometheus counter
    this.postCounter.inc();

    // 9. Emit an event or log for further processing
    const postCreatedEvent: BaseEvent<any> = {
      eventId: uuidv7(),
      eventType: "engagement.post.created",
      eventVersion: "1.0",
      timestamp: new Date().toISOString(),
      producer: "engagement-service",
      correlationId: correlationId,
      actorId: userId,
      data: {
        post_id: savedPost.id,
      },
    };

    await publishEvent("engagement.events", postCreatedEvent);

    // 10. Return the created post
    return savedPost;
  }
}
