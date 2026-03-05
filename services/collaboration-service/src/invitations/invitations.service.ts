import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectModel, InjectConnection } from "@nestjs/mongoose";
import { Model, Connection, Types } from "mongoose";
import {
  ProjectInvitation,
  InvitationStatus,
  type ProjectInvitationDocument,
} from "./schemas/project-invitation.schema.js";
import {
  ProjectMember,
  type ProjectMemberDocument,
} from "../members/schemas/project-member.schema.js";
import {
  Project,
  type ProjectDocument,
} from "../projects/schemas/project.schema.js";
import {
  CreateInvitationDto,
  RespondInvitationDto,
} from "./dto/invitation.dto.js";
import { publishEvent, type BaseEvent } from "@decp/event-bus";
import { v7 as uuidv7 } from "uuid";
import { PinoLogger, InjectPinoLogger } from "nestjs-pino";

@Injectable()
export class InvitationsService {
  constructor(
    @InjectModel(ProjectInvitation.name)
    private readonly inviteModel: Model<ProjectInvitationDocument>,

    @InjectModel(ProjectMember.name)
    private readonly memberModel: Model<ProjectMemberDocument>,

    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,

    @InjectConnection() private readonly connection: Connection,

    @InjectPinoLogger(InvitationsService.name)
    private readonly logger: PinoLogger,
  ) {}

  // ========================================================================
  // SEND INVITATION
  // ========================================================================
  async createInvitation(
    actorId: string,
    correlationId: string,
    projectId: string,
    dto: CreateInvitationDto,
  ) {
    // 1. Check if they are already a member
    if (dto.inviteeId) {
      const existingMember = await this.memberModel.exists({
        projectId: new Types.ObjectId(projectId),
        userId: dto.inviteeId,
      });
      if (existingMember)
        throw new ConflictException(
          "User is already a member of this project.",
        );
    }

    // 2. Set Expiration (e.g., 7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    try {
      // 3. Create the Invite
      const invite = new this.inviteModel({
        projectId: new Types.ObjectId(projectId),
        inviterId: actorId,
        inviteeId: dto.inviteeId,
        inviteeEmail: dto.inviteeEmail,
        role: dto.role,
        expiresAt,
      });

      const savedInvite = await invite.save();

      // Emit Event (Notification Service will catch this and send the Email/Push!)
      const inviteEvent: BaseEvent<any> = {
        eventId: uuidv7(),
        eventType: "collaboration.member.invited",
        eventVersion: "1.0",
        timestamp: new Date().toISOString(),
        producer: "collaboration-service",
        correlationId,
        actorId,
        data: {
          invitation_id: savedInvite._id.toString(),
          project_id: projectId,
          invitee_id: dto.inviteeId,
          invitee_email: dto.inviteeEmail,
          role: dto.role,
        },
      };
      publishEvent("collaboration.events", inviteEvent).catch((err) =>
        this.logger.error(
          { error: err, correlationId, invitationId: savedInvite._id },
          "Failed to publish invitation event",
        ),
      );

      return savedInvite;
    } catch (error: any) {
      // Catch our Unique Index collision if an invite is already pending
      this.logger.error(
        { error, correlationId, projectId, inviteeId: dto.inviteeId },
        "Failed to create invitation",
      );
      if (error.code === 11000) {
        throw new ConflictException(
          "A pending invitation already exists for this user.",
        );
      }
      throw error;
    }
  }

  // ========================================================================
  // RESPOND TO INVITATION (Atomic Transaction)
  // ========================================================================
  async respondToInvitation(
    actorId: string,
    correlationId: string,
    dto: RespondInvitationDto,
  ) {
    const { invitationId, status } = dto;

    const invite = await this.inviteModel.findById(invitationId).exec();
    if (!invite)
      throw new NotFoundException("Invitation not found or has expired");

    // Security check: Only the invitee can respond
    if (invite.inviteeId !== actorId) {
      throw new ForbiddenException(
        "You are not authorized to respond to this invitation.",
      );
    }

    if (invite.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(`Invitation is already ${invite.status}`);
    }

    // If DECLINED, just update the status (no transaction needed)
    if (dto.status === "DECLINED") {
      invite.status = InvitationStatus.DECLINED;
      await invite.save();
      return { success: true, message: "Invitation declined." };
    }

    // ✨ THE ACCEPTANCE TRANSACTION ✨
    const session = await this.connection.startSession();
    try {
      await session.withTransaction(async () => {
        // Step 1: Mark Invite as Accepted
        invite.status = InvitationStatus.ACCEPTED;
        await invite.save({ session });

        // Step 2: Create the Membership Record
        const newMember = new this.memberModel({
          projectId: invite.projectId,
          userId: actorId,
          role: invite.role,
        });
        await newMember.save({ session });

        // Step 3: Atomically Increment Project Member Count
        await this.projectModel.updateOne(
          { _id: invite.projectId },
          { $inc: { memberCount: 1 } },
          { session },
        );
      });
    } catch (error) {
      this.logger.error(
        { error, correlationId, invitationId },
        "Failed to process invitation acceptance transaction",
      );
      throw new InternalServerErrorException(
        "Failed to join project. Please try again.",
      );
    } finally {
      await session.endSession();
    }

    // Post-Transaction Event Emission
    const joinedEvent: BaseEvent<any> = {
      eventId: uuidv7(),
      eventType: "collaboration.member.joined",
      eventVersion: "1.0",
      timestamp: new Date().toISOString(),
      producer: "collaboration-service",
      correlationId,
      actorId,
      data: {
        project_id: invite.projectId.toString(),
        user_id: actorId,
        role: invite.role,
      },
    };
    publishEvent("collaboration.events", joinedEvent).catch((err) => {
      this.logger.error(
        { error: err, correlationId, invitationId },
        "Failed to publish joined event",
      );
    });

    return { success: true, message: "Successfully joined the project!" };
  }
}
