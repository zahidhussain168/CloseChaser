import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/current-user.decorator";
import type { AuthUser } from "../../common/current-user.decorator";
import { ClientsService } from "./clients.service";
import { CreateClientDto, UpdateClientDto } from "./dto";

@ApiTags("clients")
@ApiBearerAuth("bookkeeper")
@Controller("clients")
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  @ApiOperation({ summary: "Every client belonging to the signed-in firm" })
  list(@CurrentUser() user: AuthUser) {
    return this.clients.list(user.userId);
  }

  @Get(":id")
  @ApiOperation({ summary: "One client, scoped to the firm" })
  get(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.clients.get(user.userId, id);
  }

  @Post()
  @ApiOperation({ summary: "Add a client" })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateClientDto) {
    return this.clients.create(user.userId, dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a client" })
  update(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clients.update(user.userId, id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remove a client and everything under it" })
  remove(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.clients.remove(user.userId, id);
  }
}
