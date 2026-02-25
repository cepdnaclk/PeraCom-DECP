import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
} from "class-validator";

export class UpdateProfileDto {
  @IsNotEmpty()
  @IsUUID()
  id!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  first_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  middle_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  last_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  residence?: string;

  @IsOptional()
  @IsUrl()
  profile_pic?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  header_img?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  headline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;
}
