import { Module } from "@nestjs/common";
import { ItemsController, PortalItemsController } from "./items.controller";
import { ItemsService } from "./items.service";
import { TenantService } from "../../common/tenant.service";
import { StorageService } from "../../common/storage.service";

@Module({
  controllers: [ItemsController, PortalItemsController],
  providers: [ItemsService, TenantService, StorageService],
  exports: [ItemsService],
})
export class ItemsModule {}
