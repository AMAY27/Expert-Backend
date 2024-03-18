import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { UserService } from '../../user/user.service';
import { InjectModel } from '@nestjs/mongoose';
import { Website } from '../schemas/website.schema';
import { Model } from 'mongoose';
import { Pattern } from '../schemas/pattern.schema';
import { Comment } from '../schemas/comment.schema';

@Injectable()
export class WebsiteValidation {
  private readonly logger = new Logger(WebsiteValidation.name);

  constructor(
    @InjectModel(Website.name) private readonly websiteModel: Model<Website>,
    @InjectModel(Pattern.name) private readonly patternModel: Model<Pattern>,
    @InjectModel(Comment.name) private readonly commentModel: Model<Comment>,
    private readonly userService: UserService,
  ) {}
  async checkUserExists(userId: string) {
    const existingUser = await this.userService.findUserById(userId);
    if (!existingUser) {
      this.logger.debug(`User not found with id: ${userId}`);
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return existingUser;
  }

  async checkWebsiteExists(websiteId: string) {
    const existingWebsite = await this.websiteModel.findById(websiteId).exec();
    if (!existingWebsite) {
      this.logger.debug(`Website not found with id: ${websiteId}`);
      throw new HttpException('Website not found', HttpStatus.NOT_FOUND);
    }
    return existingWebsite;
  }

  async checkPatternExists(patternId: string) {
    const existingPattern = await this.patternModel.findById(patternId).exec();
    if (!existingPattern) {
      this.logger.debug(`Pattern not found with id: ${patternId}`);
      throw new HttpException('Pattern not found', HttpStatus.NOT_FOUND);
    }
    return existingPattern;
  }

  async checkCommentExists(commentId: string) {
    const existingComment = await this.commentModel.findById(commentId).exec();
    if (!existingComment) {
      this.logger.debug(`Comment not found with id: ${commentId}`);
      throw new HttpException('Comment not found', HttpStatus.NOT_FOUND);
    }
  }

  async getPatternForParticularWebsite(websiteId: string){
    return this.patternModel.find({ websiteId }).exec(); 
  }
}
