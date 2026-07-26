import { Module } from "@nestjs/common";
import { TenantService } from "../../common/tenant.service";
import { MailerService } from "../../common/mailer.service";
import { MagicLinkService } from "../../common/magic-link.service";
import { ChaseService } from "./chase.service";
import { ChaseController } from "./chase.controller";

@Module({
  controllers: [ChaseController],
  providers: [ChaseService, TenantService, MailerService, MagicLinkService],
})
export class ChaseModule {}
