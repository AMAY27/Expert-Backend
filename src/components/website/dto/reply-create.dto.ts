import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class ReplyCreateDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Expert id is required' })
  expertId: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Comment content is required' })
  content: string;
}
