import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ItemResponse, SignedUploadResponse, SignedUrlResponse } from "../../common/api-responses";
import { IsString, MaxLength, MinLength } from "class-validator";
import { Public } from "../../common/public.decorator";
import { CurrentUser, Portal } from "../../common/current-user.decorator";
import type { AuthUser, PortalPrincipal } from "../../common/current-user.decorator";
import { PortalGuard } from "../../auth/portal.guard";
import { TenantService } from "../../common/tenant.service";
import { ItemsService } from "./items.service";
import { AnswerItemDto, ConfirmUploadDto, CreateItemDto, SignUploadDto } from "./dto";

class DownloadQuery {
  @IsString() @MaxLength(400)
  path!: string;
}

class AnnotateItemDto {
  @IsString() @MinLength(1) @MaxLength(200)
  title!: string;

  @IsString() @MaxLength(2000)
  note!: string;
}

/** Bookkeeper-facing item routes. Global JWT guard applies. */
@ApiTags("items")
@ApiBearerAuth("bookkeeper")
@Controller()
export class ItemsController {
  constructor(
    private readonly items: ItemsService,
    private readonly tenant: TenantService,
  ) {}

  @Get("clients/:clientId/items")
  @ApiOperation({ summary: "Items blocking this client's close" })
  @ApiOkResponse({ type: [ItemResponse] })
  list(@CurrentUser() user: AuthUser, @Param("clientId", ParseUUIDPipe) clientId: string) {
    return this.items.listForClient(user.userId, clientId);
  }

  @Post("clients/:clientId/items")
  @ApiOperation({ summary: "Request something from a client" })
  @ApiOkResponse({ type: ItemResponse })
  create(
    @CurrentUser() user: AuthUser,
    @Param("clientId", ParseUUIDPipe) clientId: string,
    @Body() dto: CreateItemDto,
  ) {
    return this.items.create(user.userId, clientId, dto);
  }

  @Post("items/:id/rule-off")
  @ApiOperation({ summary: "Accept the answer and rule the item off" })
  @ApiOkResponse({ type: ItemResponse })
  ruleOff(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.items.ruleOff(user.userId, id);
  }

  @Delete("items/:id")
  @ApiOperation({ summary: "Remove an item" })
  remove(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.items.remove(user.userId, id);
  }

  @Post("clients/:clientId/items/annotate")
  @ApiOperation({ summary: "Note an item by title on the current close, creating it if needed" })
  annotate(
    @CurrentUser() user: AuthUser,
    @Param("clientId", ParseUUIDPipe) clientId: string,
    @Body() dto: AnnotateItemDto,
  ) {
    return this.items.annotate(user.userId, clientId, dto.title, dto.note);
  }

  @Get("items/:id/download")
  @ApiOperation({ summary: "Short-lived signed URL for an attachment" })
  @ApiOkResponse({ type: SignedUrlResponse })
  async download(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Query() q: DownloadQuery,
  ) {
    const firmId = await this.tenant.firmIdForUser(user.userId);
    await this.tenant.assertItemOwnedByFirm(firmId, id);
    return this.items.downloadUrl(q.path);
  }

  @Post("items/:id/uploads/sign")
  @ApiOperation({ summary: "Signed upload URL (bookkeeper). Bytes go direct to storage." })
  @ApiOkResponse({ type: SignedUploadResponse })
  async sign(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: SignUploadDto,
  ) {
    const firmId = await this.tenant.firmIdForUser(user.userId);
    const item = await this.tenant.assertItemOwnedByFirm(firmId, id);
    return this.items.signUpload(item.clientId, id, dto.filename, dto.mime, dto.size);
  }
}

/** Client portal routes. Portal token only, never a bookkeeper token. */
@ApiTags("portal")
@ApiBearerAuth("portal")
@Public()
@UseGuards(PortalGuard)
@Controller("portal")
export class PortalItemsController {
  constructor(
    private readonly items: ItemsService,
    private readonly tenant: TenantService,
  ) {}

  @Get("items")
  @ApiOperation({ summary: "The client's own checklist" })
  @ApiOkResponse({ type: [ItemResponse] })
  list(@Portal() portal: PortalPrincipal) {
    return this.items.listForPortal(portal.clientId);
  }

  @Post("items/:id/answer")
  @ApiOperation({ summary: "Send an answer back" })
  @ApiOkResponse({ type: ItemResponse })
  answer(
    @Portal() portal: PortalPrincipal,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AnswerItemDto,
  ) {
    return this.items.answer(portal.clientId, id, dto);
  }

  @Post("items/:id/uploads/sign")
  @ApiOperation({ summary: "Signed upload URL (client). Bytes go direct to storage." })
  @ApiOkResponse({ type: SignedUploadResponse })
  async sign(
    @Portal() portal: PortalPrincipal,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: SignUploadDto,
  ) {
    await this.tenant.assertItemOwnedByClient(portal.clientId, id);
    return this.items.signUpload(portal.clientId, id, dto.filename, dto.mime, dto.size);
  }

  @Post("items/:id/uploads/confirm")
  @ApiOperation({ summary: "Record the uploaded file against the item" })
  @ApiOkResponse({ type: ItemResponse })
  async confirm(
    @Portal() portal: PortalPrincipal,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ConfirmUploadDto,
  ) {
    const item = await this.tenant.assertItemOwnedByClient(portal.clientId, id);
    return this.items.confirmUpload(portal.clientId, id, dto, item.attachments);
  }
}
