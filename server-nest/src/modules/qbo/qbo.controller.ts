import { Controller, Get, Param, ParseUUIDPipe, Post, Query, Res } from "@nestjs/common";
import { ApiBearerAuth, ApiExcludeEndpoint, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { Public } from "../../common/public.decorator";
import { CurrentUser } from "../../common/current-user.decorator";
import type { AuthUser } from "../../common/current-user.decorator";
import { QboService } from "./qbo.service";

/** Bookkeeper-authenticated QuickBooks operations. */
@ApiTags("qbo")
@ApiBearerAuth("bookkeeper")
@Controller("qbo")
export class QboController {
  constructor(private readonly qbo: QboService) {}

  @Get("status")
  @ApiOperation({ summary: "Whether this firm has a QuickBooks company connected" })
  status(@CurrentUser() user: AuthUser) {
    return this.qbo.status(user.userId);
  }

  @Post("disconnect")
  @ApiOperation({ summary: "Revoke and remove the QuickBooks connection" })
  disconnect(@CurrentUser() user: AuthUser) {
    return this.qbo.disconnect(user.userId);
  }
}

/** The client-scoped import lives under /clients to match the app. */
@ApiTags("qbo")
@ApiBearerAuth("bookkeeper")
@Controller("clients")
export class QboImportController {
  constructor(private readonly qbo: QboService) {}

  @Post(":id/qbo/import")
  @ApiOperation({ summary: "Import this month's blocking QuickBooks transactions" })
  import(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.qbo.importForClient(user.userId, id);
  }
}

/**
 * The OAuth callback. Public: Intuit returns the browser here by a top-level
 * redirect with no session, and trust comes from the signed state instead.
 */
@ApiTags("qbo")
@Public()
@Controller("qbo")
export class QboCallbackController {
  constructor(private readonly qbo: QboService) {}

  @Get("callback")
  @ApiExcludeEndpoint()
  async callback(
    @Res() res: Response,
    @Query("code") code?: string,
    @Query("realmId") realmId?: string,
    @Query("state") state?: string,
    @Query("error") error?: string,
  ) {
    const url = await this.qbo.handleCallback({ code, realmId, state, error });
    res.redirect(url);
  }
}
