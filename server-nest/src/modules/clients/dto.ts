import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsEmail, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";

export class CreateClientDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(120)
  name!: string;

  @ApiProperty() @IsEmail() @MaxLength(200)
  email!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000)
  notes?: string;

  /** Day of the month the books must close by, for deadline-aware chasing. */
  @ApiPropertyOptional({ minimum: 1, maximum: 28 })
  @IsOptional() @IsInt() @Min(1) @Max(28)
  closeDay?: number;

  /** QBO realm id, if the client is connected. Blank for manual-only. */
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(64)
  qboRealmId?: string;
}

export class UpdateClientDto extends PartialType(CreateClientDto) {}
