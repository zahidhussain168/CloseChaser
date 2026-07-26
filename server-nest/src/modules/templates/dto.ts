import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsOptional, IsString, IsUUID,
  MaxLength, MinLength, ValidateNested,
} from "class-validator";

const ITEM_TYPES = ["transaction", "document", "questionnaire"] as const;

export class CreateTemplateDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(120)
  name!: string;
}

export class TemplateItemInput {
  @ApiProperty({ enum: ITEM_TYPES }) @IsIn(ITEM_TYPES)
  type!: string;

  @ApiProperty() @IsString() @MinLength(1) @MaxLength(200)
  title!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  note?: string;
}

/** Used by the starter packs: the frontend owns the pack contents and sends
 *  them, so the pack definitions do not need duplicating on the server. */
export class CreateTemplateWithItemsDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(120)
  name!: string;

  @ApiProperty({ type: [TemplateItemInput] })
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(50)
  @ValidateNested({ each: true }) @Type(() => TemplateItemInput)
  items!: TemplateItemInput[];
}

export class AddTemplateItemDto extends TemplateItemInput {}

export class ApplyTemplateDto {
  @ApiProperty({ format: "uuid" }) @IsUUID()
  clientId!: string;
}

export class SetDefaultTemplateDto {
  @ApiPropertyOptional({ format: "uuid", nullable: true })
  @IsOptional() @IsUUID()
  templateId?: string | null;
}

const EMAIL_KINDS = ["initial", "level1", "level2", "level3", "level4"] as const;

export class UpsertEmailTemplateDto {
  @ApiProperty({ enum: EMAIL_KINDS }) @IsIn(EMAIL_KINDS)
  kind!: string;

  @ApiProperty() @IsString() @MinLength(1) @MaxLength(200)
  subject!: string;

  @ApiProperty() @IsString() @MinLength(1) @MaxLength(5000)
  body!: string;
}
