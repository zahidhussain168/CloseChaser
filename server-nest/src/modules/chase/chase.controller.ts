import { Controller, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/current-user.decorator";
import type { AuthUser } from "../../common/current-user.decorator";
import { ChaseService } from "./chase.service";

@ApiTags("chase")
@ApiBearerAuth("bookkeeper")
@Controller("clients")
export class ChaseController {
  constructor(private readonly chase: ChaseService) {}

  @Post(":id/chase")
  @ApiOperation({ summary: "Start the initial chase: mark chasing and email the client" })
  fire(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.chase.fire(user.userId, id);
  }
}
