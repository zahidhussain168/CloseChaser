import {
  Body, Controller, Delete, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Put,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";
import { ClientResponse, DeletedResponse } from "../../common/api-responses";
import { CurrentUser } from "../../common/current-user.decorator";
import type { AuthUser } from "../../common/current-user.decorator";
import { ClientsService } from "./clients.service";
import { CreateClientDto, UpdateClientDto } from "./dto";

class SetAutoChaseDto {
  @ApiProperty() @IsBoolean()
  on!: boolean;
}

@ApiTags("clients")
@ApiBearerAuth("bookkeeper")
@Controller("clients")
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  @ApiOperation({ summary: "Every client belonging to the signed-in firm" })
  @ApiOkResponse({ type: [ClientResponse] })
  list(@CurrentUser() user: AuthUser) {
    return this.clients.list(user.userId);
  }

  @Get(":id")
  @ApiOperation({ summary: "One client, scoped to the firm" })
  @ApiOkResponse({ type: ClientResponse })
  get(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.clients.get(user.userId, id);
  }

  @Get(":id/detail")
  @ApiOperation({ summary: "Client, current period, items and link state for the detail screen" })
  async detail(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string) {
    const detail = await this.clients.detail(user.userId, id);
    if (!detail) throw new NotFoundException("Client not found");
    return detail;
  }

  @Post()
  @ApiOperation({ summary: "Add a client" })
  @ApiOkResponse({ type: ClientResponse })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateClientDto) {
    return this.clients.create(user.userId, dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a client" })
  @ApiOkResponse({ type: ClientResponse })
  update(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clients.update(user.userId, id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remove a client and everything under it" })
  @ApiOkResponse({ type: DeletedResponse })
  remove(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.clients.remove(user.userId, id);
  }

  @Post(":id/link")
  @ApiOperation({ summary: "Ensure a live magic link exists for the client" })
  ensureLink(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.clients.ensureLink(user.userId, id);
  }

  @Post(":id/link/regenerate")
  @ApiOperation({ summary: "Revoke and re-mint the client's magic link" })
  regenerateLink(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.clients.regenerateLink(user.userId, id);
  }

  @Put(":id/auto-chase")
  @ApiOperation({ summary: "Turn auto-chase on or off for the client" })
  setAutoChase(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: SetAutoChaseDto,
  ) {
    return this.clients.setAutoChase(user.userId, id, dto.on);
  }
}
