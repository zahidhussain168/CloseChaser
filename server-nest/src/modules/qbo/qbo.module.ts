import { Module } from "@nestjs/common";
import { TenantService } from "../../common/tenant.service";
import { QboConnectionService } from "./connection.service";
import { QboService } from "./qbo.service";
import { QboController, QboImportController, QboCallbackController } from "./qbo.controller";

@Module({
  controllers: [QboController, QboImportController, QboCallbackController],
  providers: [QboService, QboConnectionService, TenantService],
})
export class QboModule {}
