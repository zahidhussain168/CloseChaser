import { ApiProperty } from "@nestjs/swagger";
import { ITEM_STATES } from "../modules/items/item-state";

/**
 * Response shapes, declared so the OpenAPI spec describes what comes BACK and
 * not just what goes in. Without these the generated frontend client types
 * every response as void, which is the same as having no types at all.
 *
 * These are documentation of the existing responses, not a new serialisation
 * layer: the services already return exactly these shapes.
 */

export class ClientResponse {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() email!: string;
  @ApiProperty({ nullable: true, type: String }) phone!: string | null;
  @ApiProperty({ nullable: true, type: String }) notes!: string | null;
  @ApiProperty({
    nullable: true, type: Number,
    description: "Day of the month the books are due to close.",
  })
  close_day!: number | null;
  @ApiProperty({ description: "Start next month's close from the template automatically." })
  auto_chase!: boolean;
  @ApiProperty({ nullable: true, type: String }) qbo_realm_id!: string | null;
  @ApiProperty({ format: "date-time" }) created_at!: string;
}

export class AttachmentResponse {
  @ApiProperty() path!: string;
  @ApiProperty() name!: string;
  @ApiProperty() size!: number;
  @ApiProperty() mime!: string;
  @ApiProperty() uploaded_at!: string;
}

export class ItemResponse {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty() type!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ enum: ITEM_STATES }) state!: string;
  @ApiProperty({ description: "Derived: the item is accepted." })
  ruledOff!: boolean;
  @ApiProperty({ description: "Derived: still open past the grace period." })
  overdue!: boolean;
  @ApiProperty() daysOpen!: number;
  @ApiProperty({ nullable: true, type: String }) answerText!: string | null;
  @ApiProperty({ type: [AttachmentResponse] }) attachments!: AttachmentResponse[];
  @ApiProperty({ format: "date-time" }) createdAt!: string;
  @ApiProperty({ nullable: true, format: "date-time", type: String }) answeredAt!: string | null;
  @ApiProperty({ nullable: true, format: "date-time", type: String }) acceptedAt!: string | null;
}

export class SignedUploadResponse {
  @ApiProperty({ description: "Server-derived object path. Never caller supplied." })
  path!: string;
  @ApiProperty() token!: string;
  @ApiProperty() signedUrl!: string;
  @ApiProperty() bucket!: string;
}

export class SignedUrlResponse {
  @ApiProperty() url!: string;
}

export class DeletedResponse {
  @ApiProperty() deleted!: boolean;
}

export class EntitlementFeatures {
  @ApiProperty() forecast!: boolean;
  @ApiProperty() aiAnalyst!: boolean;
  @ApiProperty() responsiveness!: boolean;
  @ApiProperty() closeReceipt!: boolean;
  @ApiProperty() smsEscalation!: boolean;
  @ApiProperty() bulkChase!: boolean;
  @ApiProperty() autoChase!: boolean;
  @ApiProperty() emailPreview!: boolean;
  @ApiProperty() autoEscalatingReminders!: boolean;
}

export class EntitlementsResponse {
  @ApiProperty({ enum: ["free", "pro", "scale"] }) tier!: string;
  @ApiProperty({ enum: ["trialing", "active", "past_due", "paused", "canceled", "expired"] })
  status!: string;
  @ApiProperty({ nullable: true, format: "date-time", type: String }) trialEndsAt!: string | null;
  @ApiProperty({ nullable: true, format: "date-time", type: String })
  currentPeriodEnd!: string | null;
  @ApiProperty({ type: EntitlementFeatures }) features!: EntitlementFeatures;
}

export class ReminderEventResponse {
  @ApiProperty() type!: string;
  @ApiProperty({ format: "date-time" }) occurred_at!: string;
}

export class ReminderResponse {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty({ minimum: 1, maximum: 4 }) level!: number;
  @ApiProperty({ description: "friendly, specific-deadline, consequence or weekly" })
  levelLabel!: string;
  @ApiProperty() channel!: string;
  @ApiProperty({ nullable: true, format: "date-time", type: String }) sentAt!: string | null;
  @ApiProperty({ nullable: true, type: String }) stoppedReason!: string | null;
  @ApiProperty({ format: "date-time" }) createdAt!: string;
  @ApiProperty({ type: [ReminderEventResponse] }) events!: ReminderEventResponse[];
}

export class PauseResponse {
  @ApiProperty({ format: "uuid" }) clientId!: string;
  @ApiProperty() paused!: boolean;
}
