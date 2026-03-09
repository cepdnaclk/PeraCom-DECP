import { Controller, Post, Body } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { GoogleLoginDto } from "./dto/google-login.dto.js";
import { CorrelationId } from "./decorators/correlation-id.decorator.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/google
  @Post("google")
  async googleLogin(
    @Body() googleLoginDto: GoogleLoginDto,
    @CorrelationId() correlationId: string,
  ) {
    return this.authService.loginWithGoogle(
      googleLoginDto.token,
      correlationId,
    );
  }
}
