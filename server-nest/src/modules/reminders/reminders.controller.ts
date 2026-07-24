import {
  Body, Controller, ForbiddenException, Get, Headers, Param, ParseUUIDPipe, Post, UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiExcludeEndpoint, ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from "@nestjs/swagger";
import { PauseResponse, ReminderResponse } from "../../common/api-responses";
import { IsBoolean } from "class-validator";
import { timingSafeEqual } from "crypto";
import { Throttle } from "@nestjs/throttler";
import { Public } from "../../common/public.decorator";
import { CurrentUser } from "../../common/current-user.decorator";
import type { AuthUser } from "../../common/current-user.decorator";
import { SuppressionService } from "../../common/suppression.service";
import { RemindersService } from "./reminders.service";

class PauseDto {
  @ApiProperty({ description: "True to hold the chase, false to resume it." })
  @IsBoolean()
  paused!: boolean;
}

@ApiTags("reminders")
@ApiBearerAuth("bookkeeper")
@Controller()
export class RemindersController {
  constructor(
    private readonly reminders: RemindersService,
    private readonly suppression: SuppressionService,
  ) {}

  @Post("clients/:clientId/chase/pause")
  @ApiOperation({ summary: "Hold or resume the chase for a client" })
  @ApiOkResponse({ type: PauseResponse })
  pause(
    @CurrentUser() user: AuthUser,
    @Param("clientId", ParseUUIDPipe) clientId: string,
    @Body() dto: PauseDto,
  ) {
    return this.reminders.setPaused(user.userId, clientId, dto.paused);
  }

  @Get("clients/:clientId/reminders")
  @ApiOperation({ summary: "Reminders sent to this client, with delivery events" })
  @ApiOkResponse({ type: [ReminderResponse] })
  history(@CurrentUser() user: AuthUser, @Param("clientId", ParseUUIDPipe) clientId: string) {
    return this.reminders.history(user.userId, clientId);
  }
}

/**
 * The sweep endpoint. Not bookkeeper-authenticated, because a scheduler calls
 * it, so it carries its own shared secret and is rate limited hard.
 */
@ApiTags("cron")
@Public()
@Controller("cron")
export class ReminderCronController {
  constructor(private readonly reminders: RemindersService) {}

  @Post("reminders")
  @Throttle({ default: { ttl: 60_000, limit: 4 } })
  @ApiExcludeEndpoint()
  async run(@Headers("authorization") auth?: string) {
    assertCronSecret(auth);
    return this.reminders.sweep();
  }
}

/**
 * Constant-time compare, and a hard failure when the secret is unset: an empty
 * expected value must never mean "everyone is allowed".
 */
function assertCronSecret(auth?: string): void {
  const expected = process.env.CRON_SECRET;
  if (!expected) throw new ForbiddenException("Cron is not configured");
  const got = (auth ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new ForbiddenException("Bad cron secret");
  }
}
