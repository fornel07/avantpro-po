import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateBoardDto {
  @IsInt()
  jiraBoardId!: number;
}

export class UpdateBoardDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;
}
