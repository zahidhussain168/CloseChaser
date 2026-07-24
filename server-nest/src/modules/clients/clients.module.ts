import { Module } from "@nestjs/common";
import { ClientsController } from "./clients.controller";
import { ClientsService } from "./clients.service";
import { TenantService } from "../../common/tenant.service";

@Module({
  controllers: [ClientsController],
  providers: [ClientsService, TenantService],
  exports: [ClientsService],
})
export class ClientsModule {}
