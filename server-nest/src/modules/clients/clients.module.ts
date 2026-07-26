import { Module } from "@nestjs/common";
import { ClientsController } from "./clients.controller";
import { ClientsService } from "./clients.service";
import { TenantService } from "../../common/tenant.service";
import { MagicLinkService } from "../../common/magic-link.service";

@Module({
  controllers: [ClientsController],
  providers: [ClientsService, TenantService, MagicLinkService],
  exports: [ClientsService],
})
export class ClientsModule {}
