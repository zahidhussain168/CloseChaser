import { Module } from "@nestjs/common";
import { TenantService } from "../../common/tenant.service";
import { TemplatesService } from "./templates.service";
import { TemplatesController } from "./templates.controller";

@Module({
  controllers: [TemplatesController],
  providers: [TemplatesService, TenantService],
})
export class TemplatesModule {}
