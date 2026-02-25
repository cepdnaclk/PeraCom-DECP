import { IsEnum, IsNotEmpty, IsOptional, IsUrl, IsUUID } from "class-validator";

export enum SocialPlatform {
  LinkedIn = "LinkedIn",
  GitHub = "GitHub",
  Portfolio = "Portfolio",
  Personal = "Personal",
  Facebook = "Facebook",
  Twitter = "Twitter",
  ResearchGate = "ResearchGate",
  Other = "Other",
}

export class SocialLinkDto {
  @IsNotEmpty()
  @IsEnum(SocialPlatform)
  platform!: SocialPlatform;

  @IsNotEmpty()
  @IsUrl()
  url!: string;
}
