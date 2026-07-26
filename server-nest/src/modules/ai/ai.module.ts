import { Module } from "@nestjs/common";
import { TenantService } from "../../common/tenant.service";
import { AiService } from "./ai.service";
import { AiController } from "./ai.controller";

@Module({
  controllers: [AiController],
  providers: [AiService, TenantService],
})
export class AiModule {}
