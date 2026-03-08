import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
} from "class-validator";
import { UserRole } from "./update-admin.dto.js";

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  // This automatically enforces your university domain rule!
  @Matches(/^[^\s@]+@([^\s@]+\.)?pdn\.ac\.lk$/, {
    message: "Use the university email address",
  })
  email!: string;

  @IsString()
  @IsNotEmpty()
  first_name!: string;

  @IsString()
  @IsNotEmpty()
  last_name!: string;

  @IsNotEmpty()
  @IsEnum(UserRole)
  role!: UserRole;
}
