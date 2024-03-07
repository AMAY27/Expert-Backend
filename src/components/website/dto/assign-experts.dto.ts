import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsNotEmpty } from 'class-validator';

export class AssignExpertsDto {
  @ApiProperty({ required: true })
  @ArrayNotEmpty({ message: 'Expert ids is required' })
  expertIds: string[];

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Primary expert id is required' })
  primaryExpertId: string;
}
