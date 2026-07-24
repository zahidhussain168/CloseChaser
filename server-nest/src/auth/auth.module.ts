import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { SupabaseJwtStrategy } from "./supabase-jwt.strategy";
import { PortalJwtStrategy } from "./portal-jwt.strategy";
import { PortalTokenService } from "./portal-token.service";
import { AuthController } from "./auth.controller";

@Global()
@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [SupabaseJwtStrategy, PortalJwtStrategy, PortalTokenService],
  exports: [PortalTokenService],
})
export class AuthModule {}
