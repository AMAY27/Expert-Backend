import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class WebsiteCreateDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'User id is required' })
  userId: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Base url is required' })
  baseUrl: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Website Name is required' })
  websiteName: string;

  @ApiProperty({ required: false })
  additionalUrls: string[];

  @ApiProperty({ required: false })
  description: string;

  @ApiProperty({required: true})
  primaryExpertId : string;

  @ApiProperty({ required: false })
  expertIds: string[];

}
