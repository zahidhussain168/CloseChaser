import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ArrayMaxSize, IsArray, IsIn, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";

export class CreateItemDto {
  @ApiProperty({ enum: ["transaction", "document", "questionnaire"] })
  @IsIn(["transaction", "document", "questionnaire"])
  type!: "transaction" | "document" | "questionnaire";

  @ApiProperty() @IsString() @MinLength(1) @MaxLength(200)
  title!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000)
  note?: string;

  /** For a questionnaire: the short questions the client answers at once. */
  @ApiPropertyOptional({ type: [String] })
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) @MaxLength(300, { each: true })
  questions?: string[];
}

export class AnswerItemDto {
  @ApiProperty({ description: "What the client typed back" })
  @IsString() @MinLength(1) @MaxLength(4000)
  answerText!: string;
}

export class SignUploadDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(255)
  filename!: string;

  @ApiProperty() @IsString() @MaxLength(120)
  mime!: string;

  @ApiProperty({ description: "Bytes. Rejected above the bucket limit." })
  @IsInt() @Min(1)
  size!: number;
}

export class ConfirmUploadDto {
  @ApiProperty({ description: "Storage path returned by the sign step" })
  @IsString() @MinLength(1) @MaxLength(400)
  path!: string;

  @ApiProperty() @IsString() @MaxLength(255)
  name!: string;

  @ApiProperty() @IsInt() @Min(1)
  size!: number;

  @ApiProperty() @IsString() @MaxLength(120)
  mime!: string;
}
