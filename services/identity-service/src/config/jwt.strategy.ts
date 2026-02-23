import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      // Extracts the token from the standard 'Bearer <token>' header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Rejects expired tokens automatically
      secretOrKey: configService.get<string>('jwt.secret') || 'super-secret-fallback-key',
    });
  }

  // If the signature is valid, Passport automatically calls this function
  // The 'payload' is the decrypted JSON we created earlier: { sub: user.id, role: user.role }
  async validate(payload: any) {
    // Whatever we return here gets permanently attached to the 'req.user' object
    return { sub: payload.sub, role: payload.role };
  }
}