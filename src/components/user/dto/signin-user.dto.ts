import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { UserType } from '../enum/user-type.enum';
import { ApiProperty } from '@nestjs/swagger';

export class SigninUserDto {
  @ApiProperty()
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Password cannot be empty' })
  @IsString({ message: 'Password must be string' })
  password: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Role is required' })
  @IsString({ message: 'Role must be string' })
  @IsEnum(UserType, { message: 'Invalid role' })
  role: string;
}
