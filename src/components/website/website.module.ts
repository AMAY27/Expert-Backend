import { Module } from '@nestjs/common';
import { WebsiteController } from './website.controller';
import { WebsiteService } from './website.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Website, WebsiteSchema } from './schemas/website.schema';
import { UserService } from 'src/components/user/user.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthGuard } from 'src/auth/auth.guard';
import { User, UserSchema } from 'src/components/user/schemas/user.schema';
import { Pattern, PatternSchema } from './schemas/pattern.schema';
import { Comment, CommentSchema } from './schemas/comment.schema';
import { AwsHelper } from '../aws/aws.helper';
import { WebsiteValidation } from './validation/website.validation';
import { WebsiteConverter } from './converter/website.converter';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Website.name, schema: WebsiteSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Pattern.name, schema: PatternSchema }]),
    MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '60m' },
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
  ],
  controllers: [WebsiteController],
  providers: [
    WebsiteService,
    UserService,
    AuthGuard,
    AwsHelper,
    WebsiteValidation,
    WebsiteConverter,
  ],
})
export class WebsiteModule {}
