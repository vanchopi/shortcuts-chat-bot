import { IsNotEmpty, IsString } from 'class-validator';

export class MasterResponseDto {
  @IsString()
  @IsNotEmpty()
  text!: string;
}