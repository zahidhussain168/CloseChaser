import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, ValidateIf } from "class-validator";

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
