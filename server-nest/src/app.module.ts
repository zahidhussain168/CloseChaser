import { Global, Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { LoggerModule } from "nestjs-pino";
import { PrismaService } from "./common/prisma.service";
import { AllExceptionsFilter } from "./common/all-exceptions.filter";
import { AuthModule } from "./auth/auth.module";
import { JwtAuthGuard } from "./auth/jwt-auth.guard";
import { HealthController } from "./health/health.controller";
import { ClientsModule } from "./modules/clients/clients.module";
import { ItemsModule } from "./modules/items/items.module";
import { RemindersModule } from "./modules/reminders/reminders.module";
import { BillingModule } from "./modules/billing/billing.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";

@Global()
@Module({ providers: [PrismaService], exports: [PrismaService] })
class PrismaModule {}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? "info",
        // Never log credentials or the tokens that grant client access.
        redact: [
          "req.headers.authorization",
          "req.headers.cookie",
          "req.headers['x-cron-secret']",
        ],
        autoLogging: { ignore: (req) => req.url === "/api/health" },
      },
    }),
    // Baseline limit. Individual routes tighten this (portal + webhooks).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    ClientsModule,
    ItemsModule,
    RemindersModule,
    BillingModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
