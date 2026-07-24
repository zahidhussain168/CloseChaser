import { Module } from "@nestjs/common";
import { TenantService } from "../../common/tenant.service";
import { BillingService } from "./billing.service";
import { BillingController, PaddleWebhookController } from "./billing.controller";

@Module({
  controllers: [BillingController, PaddleWebhookController],
  providers: [BillingService, TenantService],
  exports: [BillingService],
})
export class BillingModule {}
