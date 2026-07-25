import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/current-user.decorator";
import type { AuthUser } from "../../common/current-user.decorator";
import { TemplatesService } from "./templates.service";

@ApiTags("templates")
@ApiBearerAuth("bookkeeper")
@Controller("templates")
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @Get()
  @ApiOperation({ summary: "Every request template for the firm, with its items" })
  list(@CurrentUser() user: AuthUser) {
    return this.templates.list(user.userId);
  }
}
