import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class PatternCreateDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Expert id is required' })
  createdByExpertId: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Pattern type is required' })
  patternType: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Pattern description is required' })
  description: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Pattern detected url is required' })
  detectedUrl: string;
}
