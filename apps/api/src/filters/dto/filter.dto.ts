import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateFilterDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsObject()
  query!: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateFilterDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsObject()
  query?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
