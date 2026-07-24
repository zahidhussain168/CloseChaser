import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../common/public.decorator";
import { PrismaService } from "../common/prisma.service";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "Liveness and database reachability" })
  async check() {
    const started = Date.now();
    let db = "ok";
    try {
      await this.prisma.db.$queryRaw`select 1`;
    } catch {
      db = "unreachable";
    }
    return { status: db === "ok" ? "ok" : "degraded", db, latencyMs: Date.now() - started };
  }
}
