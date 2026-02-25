import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsUrl,
  IsDate,
} from "class-validator";

export class ProjectDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsNotEmpty()
  @IsDate()
  start_date!: Date;

  @IsOptional()
  @IsDate()
  end_date?: Date;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  link?: string;
}
