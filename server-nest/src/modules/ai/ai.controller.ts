import { Body, Controller, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import { CurrentUser } from "../../common/current-user.decorator";
import type { AuthUser } from "../../common/current-user.decorator";
import { AiService } from "./ai.service";

class ChaseEmailsDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(2000)
  voice?: string;

  @ApiProperty({ enum: ["Warm", "Balanced", "Firm"] }) @IsIn(["Warm", "Balanced", "Firm"])
  tone!: string;
}

@ApiTags("ai")
@ApiBearerAuth("bookkeeper")
@Controller()
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post("ai/chase-emails")
  @ApiOperation({ summary: "Generate the chase-email ladder in the firm's voice" })
  chaseEmails(@CurrentUser() user: AuthUser, @Body() dto: ChaseEmailsDto) {
    return this.ai.chaseEmails(user.userId, dto.voice ?? "", dto.tone);
  }

  @Post("clients/:id/insight")
  @ApiOperation({ summary: "AI analyst read for one client" })
  insight(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.ai.clientInsight(user.userId, id);
  }
}
