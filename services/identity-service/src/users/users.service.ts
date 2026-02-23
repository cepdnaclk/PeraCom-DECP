import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { v7 as uuidv7 } from "uuid";
import { publishEvent, type BaseEvent } from "@decp/event-bus";
import type { CreateUserDto } from "./dto/create-user.dto.js";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createSingleUser(data: CreateUserDto) {
    // 1. Check if email already exists
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    // 2. If email exists, throw an error
    if (existing) {
      console.log("Email already exists:", data.email);
      throw new BadRequestException("Email already exists");
    }

    // 3. Genarate registration number
    const reg_number = data.email.split("@")[0] || ""; // Extract username from email

    // 4. Generate a sequential UUIDv7
    const id = uuidv7();

    // 5. Create the user in the database
    const newUser = await this.prisma.user.create({
      data: {
        id,
        email: data.email,
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        reg_number,
        role: "STUDENT",
      },
    });

    // 6. Broadcast the event so other services can prepare
    const userCreatedEvent: BaseEvent<any> = {
      eventId: uuidv7(),
      eventType: "identity.user.created",
      eventVersion: "1.0",
      timestamp: new Date().toISOString(),
      producer: "identity-service",
      correlationId: newUser.id,
      data: {
        user_id: newUser.id,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        role: newUser.role,
      },
    };

    await publishEvent("identity.user.events", userCreatedEvent);

    return { status: "user_created" };
  }

  async validateBulkStudents(students: CreateUserDto[]) {
    const errors = [];
    const validStudents = [];

    const emails = students.map((s) => s.email);
    console.log("Validating bulk students emails:", emails);

    // Fetch existing users with the same emails in one query
    const existingUsers = await this.prisma.user.findMany({
      where: { email: { in: emails } },
    });

    // Check for duplicates and separate valid students from errors
    if (existingUsers.length > 0) {
      const existingEmails = existingUsers.map((u) => u.email);

      for (let i = 0; i < students.length; i++) {
        if (existingEmails.includes(students[i]!.email)) {
          errors.push({
            row: i + 1,
            message: "Email already exists",
          });
        } else {
          validStudents.push(students[i]);
        }
      }
    }

    // If no existing users, all students are valid
    else {
      validStudents.push(...students);
    }

    return {
      validCount: validStudents.length,
      errorCount: errors.length,
      errors,
      validStudents,
    };
  }
}
