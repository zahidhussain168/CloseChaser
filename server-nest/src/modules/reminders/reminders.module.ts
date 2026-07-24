import { Module } from "@nestjs/common";
import { TenantService } from "../../common/tenant.service";
import { MailerService } from "../../common/mailer.service";
import { SuppressionService } from "../../common/suppression.service";
import { MagicLinkService } from "../../common/magic-link.service";
import { RemindersService } from "./reminders.service";
import { ReminderCronController, RemindersController } from "./reminders.controller";

@Module({
  controllers: [RemindersController, ReminderCronController],
  providers: [RemindersService, TenantService, MailerService, SuppressionService, MagicLinkService],
  exports: [RemindersService],
})
export class RemindersModule {}
