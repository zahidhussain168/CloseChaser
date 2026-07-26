import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/current-user.decorator";
import type { AuthUser } from "../../common/current-user.decorator";
import { TemplatesService } from "./templates.service";
import {
  AddTemplateItemDto, ApplyTemplateDto, CreateTemplateDto, CreateTemplateWithItemsDto,
  SetDefaultTemplateDto, UpsertEmailTemplateDto,
} from "./dto";

@ApiTags("templates")
@ApiBearerAuth("bookkeeper")
@Controller()
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @Get("templates")
  @ApiOperation({ summary: "Every request template for the firm, with its items" })
  list(@CurrentUser() user: AuthUser) {
    return this.templates.list(user.userId);
  }

  @Post("templates")
  @ApiOperation({ summary: "Create an empty template" })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTemplateDto) {
    return this.templates.create(user.userId, dto);
  }

  @Post("templates/with-items")
  @ApiOperation({ summary: "Create a template and seed its items (starter packs)" })
  createWithItems(@CurrentUser() user: AuthUser, @Body() dto: CreateTemplateWithItemsDto) {
    return this.templates.createWithItems(user.userId, dto);
  }

  @Post("templates/:id/items")
  @ApiOperation({ summary: "Add an item to a template" })
  addItem(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AddTemplateItemDto,
  ) {
    return this.templates.addItem(user.userId, id, dto);
  }

  @Delete("templates/items/:itemId")
  @ApiOperation({ summary: "Remove a template item" })
  removeItem(@CurrentUser() user: AuthUser, @Param("itemId", ParseUUIDPipe) itemId: string) {
    return this.templates.removeItem(user.userId, itemId);
  }

  @Delete("templates/:id")
  @ApiOperation({ summary: "Remove a template" })
  remove(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.templates.remove(user.userId, id);
  }

  @Post("templates/:id/apply")
  @ApiOperation({ summary: "Apply a template to a client's current close" })
  apply(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ApplyTemplateDto,
  ) {
    return this.templates.apply(user.userId, id, dto);
  }

  @Put("clients/:clientId/default-template")
  @ApiOperation({ summary: "Set or clear a client's default template" })
  setDefault(
    @CurrentUser() user: AuthUser,
    @Param("clientId", ParseUUIDPipe) clientId: string,
    @Body() dto: SetDefaultTemplateDto,
  ) {
    return this.templates.setClientDefault(user.userId, clientId, dto);
  }

  @Put("firm/email-templates")
  @ApiOperation({ summary: "Upsert one of the firm's chase-email templates" })
  upsertEmailTemplate(@CurrentUser() user: AuthUser, @Body() dto: UpsertEmailTemplateDto) {
    return this.templates.upsertEmailTemplate(user.userId, dto);
  }
}
