import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class PublishCertificationDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Expert id is required' })
  expertId: string;

  @ApiProperty({ required: true })
  @IsBoolean()
  isCertified: boolean;

  @ApiProperty()
  expertFeedback: string;
}
