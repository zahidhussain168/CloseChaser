import { Controller, Get, Headers, HttpCode, Post, Req, UnauthorizedException } from "@nestjs/common";
import { ApiBearerAuth, ApiExcludeEndpoint, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { RawBodyRequest } from "@nestjs/common";
import type { Request } from "express";
import { Public } from "../../common/public.decorator";
import { CurrentUser } from "../../common/current-user.decorator";
import type { AuthUser } from "../../common/current-user.decorator";
import { BillingService } from "./billing.service";
import { verifyPaddleSignature } from "./paddle-signature";

@ApiTags("billing")
@ApiBearerAuth("bookkeeper")
@Controller("billing")
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get("entitlements")
  @ApiOperation({ summary: "What this firm can use right now" })
  entitlements(@CurrentUser() user: AuthUser) {
    return this.billing.entitlements(user.userId);
  }
}

/**
 * Paddle webhook. Public because Paddle authenticates with a signature rather
 * than a session, which makes that signature the only thing between a stranger
 * and a free upgrade. It is checked against the raw bytes before anything is
 * parsed.
 */
@ApiTags("billing")
@Public()
@Controller("paddle")
export class PaddleWebhookController {
  constructor(private readonly billing: BillingService) {}

  @Post("webhook")
  @HttpCode(200)
  @ApiExcludeEndpoint()
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("paddle-signature") signature?: string,
  ) {
    const raw = req.rawBody?.toString("utf8") ?? "";
    const check = verifyPaddleSignature(raw, signature, process.env.PADDLE_WEBHOOK_SECRET);
    if (!check.ok) throw new UnauthorizedException(check.reason);

    let event: unknown;
    try {
      event = JSON.parse(raw);
    } catch {
      // 200 on purpose: the signature was ours, so retrying will not fix the
      // body, and a non-2xx would make Paddle redeliver it forever.
      return { status: "ignored", reason: "body is not valid JSON" };
    }

    return this.billing.handleEvent(event as Parameters<BillingService["handleEvent"]>[0]);
  }
}
