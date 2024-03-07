import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdatePatternPhase {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Website id is required' })
  websiteId: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Pattern id is required' })
  patternId: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Expert id is required' })
  expertId: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Pattern exists check is required' })
  @IsBoolean()
  patternExists: boolean;
}
