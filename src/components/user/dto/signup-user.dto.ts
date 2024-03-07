import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { UserType } from '../enum/user-type.enum';
import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionType } from '../enum/subscription-type.enum';

export class SignUpUserDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'First name cannot be empty' })
  firstName: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Last name cannot be empty' })
  lastName: string;

  @ApiProperty()
  @IsEmail({}, { message: 'Invalid email' })
  email: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Password cannot be empty' })
  @IsString({ message: 'Password must be a string' })
  password: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Role is required' })
  @IsString({ message: 'Role must be string' })
  @IsEnum(UserType, { message: 'Invalid role' })
  role: string;

  @ApiProperty()
  @IsEnum(SubscriptionType, { message: 'Invalid subscription type' })
  subscription: string;
}
