import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { SignUpUserDto } from './dto/signup-user.dto';
import { SigninUserDto } from './dto/signin-user.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/roles.decorator';
import { UserType } from './enum/user-type.enum';

@ApiTags('User')
@Controller('user')
export class UserController {
  private readonly logger = new Logger(UserController.name);
  constructor(private readonly userService: UserService) {}

  @Post('signup')
  @ApiOperation({
    summary: 'User Sign Up [For Client/Expert/SuperAdmin]',
    description: 'Register a new user.',
  })
  async signUp(@Body() signUpUserDto: SignUpUserDto) {
    this.logger.log(`Signing up the user`);
    return await this.userService.signUp(signUpUserDto);
  }

  @Post('signin')
  @ApiOperation({
    summary: 'User Sign In [For Client/Expert/SuperAdmin]',
    description: 'Authenticate and sign in a user.',
  })
  async signIn(@Body() signInUserDto: SigninUserDto) {
    this.logger.log(
      `Signing in the user with role: ${signInUserDto.role} and email: ${signInUserDto.email}`,
    );
    return await this.userService.signIn(signInUserDto);
  }

  @Get(':userId')
  @UseGuards(AuthGuard)
  @Roles(UserType.Client, UserType.Expert, UserType.SuperAdmin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get particular user Details [For Client/Expert/SuperAdmin]',
    description: 'Retrieve details of a specific user.',
  })
  async fetchUserDetails(@Param('userId') userId: string) {
    this.logger.log(`Fetch particular user details with id: ${userId}`);
    return await this.userService.fetchParticularUserDetails(userId);
  }

  @Get()
  @UseGuards(AuthGuard)
  @Roles(UserType.SuperAdmin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all users list by user type(role) [For SuperAdmin]',
    description: 'Fetch all the users details by user type/role',
  })
  async fetchAllUsersByType(@Query('role') role: string) {
    this.logger.log(`Fetch all users of type: ${role}`);
    return await this.userService.fetchUsersByType(role);
  }
}
