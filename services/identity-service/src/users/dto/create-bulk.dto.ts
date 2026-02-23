import type { CreateUserDto } from "./create-user.dto.js";

export class CreateBulkDto {
  students!: CreateUserDto[];
}
