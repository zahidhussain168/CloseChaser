import { Module } from "@nestjs/common";
import { FirmService } from "./firm.service";
import { FirmController } from "./firm.controller";

@Module({
  controllers: [FirmController],
  providers: [FirmService],
})
export class FirmModule {}
