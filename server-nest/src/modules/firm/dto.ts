import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsEmail, IsInt, IsNotEmpty, IsString,
  Matches, Max, MaxLength, Min, ValidateIf,
} from "class-validator";

const trim = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value);

/**
 * Branding update. The frontend validates with zod, but this API is now on the
 * public internet, so it validates independently: never trust the caller.
 * Mirrors the zod schema: a non-empty name, a six-digit hex accent, and an
 * optional reply-to that must be an email when present.
 */
export class UpdateBrandingDto {
  @ApiProperty({ description: "The firm's display name.", maxLength: 120 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: "Name is required" })
  @MaxLength(120)
  name!: string;

  @ApiProperty({ description: "Accent colour as a six-digit hex.", example: "#0EA5E9" })
  @Transform(trim)
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: "Use a hex colour like #1a2b3c" })
  accent_color!: string;

  // Empty string is allowed (clears it); any other value must be a real email.
  @ApiProperty({ required: false, nullable: true, description: "Reply-to email, or empty to clear." })
  @Transform(trim)
  @ValidateIf((o) => o.reply_to !== undefined && o.reply_to !== "")
  @IsEmail({}, { message: "Reply-to must be a valid email" })
  @MaxLength(200)
  reply_to?: string;
}

/**
 * Reminder cadence. Mirrors the frontend's zod: one to six milestone offsets
 * (whole days, 1 to 90) and a weekly step of 3 to 30 days. The service dedupes
 * and sorts the offsets, so a canonical value is stored whatever the caller
 * sends.
 */
export class UpdateCadenceDto {
  @ApiProperty({ type: [Number], example: [2, 5, 9], description: "Milestone offsets in days." })
  @IsArray()
  @ArrayMinSize(1, { message: "Use between one and six days" })
  @ArrayMaxSize(6, { message: "Use between one and six days" })
  @IsInt({ each: true, message: "Days must be whole numbers from 1 to 90" })
  @Min(1, { each: true, message: "Days must be whole numbers from 1 to 90" })
  @Max(90, { each: true, message: "Days must be whole numbers from 1 to 90" })
  offsets!: number[];

  @ApiProperty({ example: 7, minimum: 3, maximum: 30 })
  @IsInt()
  @Min(3, { message: "Keep at least 3 days between later reminders" })
  @Max(30, { message: "Use 30 days or fewer between later reminders" })
  weeklyStep!: number;
}
