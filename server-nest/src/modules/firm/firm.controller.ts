import { Controller, Get, NotFoundException } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/current-user.decorator";
import type { AuthUser } from "../../common/current-user.decorator";
import { FirmService } from "./firm.service";

@ApiTags("firm")
@ApiBearerAuth("bookkeeper")
@Controller("firm")
export class FirmController {
  constructor(private readonly firm: FirmService) {}

  @Get()
  @ApiOperation({ summary: "The firm owned by the signed-in bookkeeper" })
  async get(@CurrentUser() user: AuthUser) {
    const firm = await this.firm.get(user.userId);
    if (!firm) throw new NotFoundException("No firm for this account");
    return firm;
  }
}
