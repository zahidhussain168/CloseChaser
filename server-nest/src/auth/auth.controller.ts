import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";
import { Throttle } from "@nestjs/throttler";
import { Public } from "../common/public.decorator";
import { CurrentUser, Portal } from "../common/current-user.decorator";
import type { AuthUser, PortalPrincipal } from "../common/current-user.decorator";
import { PortalGuard } from "./portal.guard";
import { PortalTokenService } from "./portal-token.service";

class ExchangeMagicLinkDto {
  /** The opaque token from the emailed magic link. */
  @IsString()
  @MinLength(20)
  token!: string;
}

@ApiTags("auth")
@Controller()
export class AuthController {
  constructor(private readonly portalTokens: PortalTokenService) {}

  @Get("auth/me")
  @ApiBearerAuth("bookkeeper")
  @ApiOperation({ summary: "The signed-in bookkeeper" })
  me(@CurrentUser() user: AuthUser) {
    return { userId: user.userId, email: user.email };
  }

  /**
   * Public on purpose: the magic-link token IS the credential. Rate limited
   * hard because it is an unauthenticated, guessable-token surface.
   */
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post("portal/session")
  @ApiOperation({ summary: "Exchange a magic link for a scoped portal token" })
  exchange(@Body() dto: ExchangeMagicLinkDto) {
    return this.portalTokens.mintFromMagicLink(dto.token);
  }

  @Public() // opt out of the bookkeeper guard...
  @UseGuards(PortalGuard) // ...and require a portal token instead
  @Get("portal/me")
  @ApiBearerAuth("portal")
  @ApiOperation({ summary: "The client behind the current portal token" })
  portalMe(@Portal() portal: PortalPrincipal) {
    return { clientId: portal.clientId, scope: portal.scope };
  }
}
