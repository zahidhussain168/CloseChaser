import { Module } from "@nestjs/common";
import { TenantService } from "../../common/tenant.service";
import { DashboardService } from "./dashboard.service";
import { DashboardController } from "./dashboard.controller";

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, TenantService],
})
export class DashboardModule {}
