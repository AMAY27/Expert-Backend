import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { WebsiteCreateDto } from './dto/website-create.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Website } from './schemas/website.schema';
import { Model } from 'mongoose';
import { UserService } from 'src/components/user/user.service';
import { WebsiteResponseDto } from './dto/website-response.dto';
import { PatternCreateDto } from './dto/pattern-create.dto';
import { Pattern } from './schemas/pattern.schema';
import { Comment } from './schemas/comment.schema';
import { CommentCreateDto } from './dto/comment-create.dto';
import { ReplyCreateDto } from './dto/reply-create.dto';
import { AssignExpertsDto } from './dto/assign-experts.dto';
import { UserType } from '../user/enum/user-type.enum';
import { ExpertVerificationPhase } from './enum/expert-verification-phase.enum';
import { UpdatePatternPhase } from './dto/update-pattern-phase.dto';
import { PatternPhaseType } from './enum/pattern-phase.enum';
import { UserResponseDto } from '../user/dto/user-response.dto';
import { WebsitePhaseType } from './enum/website-phase.enum';
import { PublishCertificationDto } from './dto/publish-certification.dto';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';
import { AwsHelper } from '../aws/aws.helper';
import { WebsiteConverter } from './converter/website.converter';
import { WebsiteValidation } from './validation/website.validation';
import { generateCertificationId } from './util/website.util';

@Injectable()
export class WebsiteService {
  private readonly logger = new Logger(WebsiteService.name);
  constructor(
    @InjectModel(Website.name) private readonly websiteModel: Model<Website>,
    @InjectModel(Pattern.name) private readonly patternModel: Model<Pattern>,
    @InjectModel(Comment.name) private readonly commentModel: Model<Comment>,
    private readonly userService: UserService,
    private configService: ConfigService,
    private readonly awsHelper: AwsHelper,
    private readonly websiteValidation: WebsiteValidation,
    private readonly websiteConverter: WebsiteConverter,
  ) {}

  async persistWebsiteDetails(websiteCreateDto: WebsiteCreateDto) {
    await this.websiteValidation.checkUserExists(websiteCreateDto.userId);

    try {
      const newWebsite = new this.websiteModel(websiteCreateDto);
      await newWebsite.save();

      return {
        websiteId: newWebsite._id,
      };
    } catch (error) {
      this.logger.error(`Error while saving website: ${error.message}`);
      throw new HttpException(
        'Failed to save website details',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async assignExpertsToWebsite(
    websiteId: string,
    assignExpertsDto: AssignExpertsDto,
  ) {
    const website = await this.websiteValidation.checkWebsiteExists(websiteId);
    const allExpertIds = [
      ...assignExpertsDto.expertIds,
      assignExpertsDto.primaryExpertId,
    ];

    await Promise.all(
      allExpertIds.map(async (expertId) => {
        await this.websiteValidation.checkUserExists(expertId);
      }),
    );

    website.expertIds = assignExpertsDto.expertIds;
    website.primaryExpertId = assignExpertsDto.primaryExpertId;

    const updatedWebsite = await website.save();
    return {
      message: `Expert successfully assigned to website with id: ${updatedWebsite._id}`,
    };
  }

  async fetchParticularWebsiteDetails(
    websiteId: string,
  ): Promise<WebsiteResponseDto> {
    const existingWebsite =
      await this.websiteValidation.checkWebsiteExists(websiteId);
    return await this.websiteConverter.convertToWebsiteResponseDto(
      existingWebsite,
    );
  }

  async getAllWebsiteDetails(userId:string) {
    const user = await this.websiteValidation.checkUserExists(userId);
    let websites:Website[];
    let patterns:Pattern[];
    if(user){
      websites = await this.websiteModel.find().sort({createdAt: -1})
      patterns = await this.patternModel.find();
    }
    return await Promise.all(
      websites.map(async (website: Website) => {
        return await this.websiteConverter.convertToWebsiteResponseDto(website);
      }),
    );
  }

  async getAllWebsiteDetailsForParticularUser(userId: string) {
    const user = await this.websiteValidation.checkUserExists(userId);
    let websites: Website[];
    if (user.role === UserType.Client) {
      websites = await this.websiteModel
        .find({ userId })
        .sort({ createdAt: -1 })
        .exec();
    } else if (user.role === UserType.Expert) {
      websites = await this.websiteModel
        .find({
          //expertIds: userId,
          userId
        })
        .sort({ createdAt: -1 })
        .exec();
    }
    console.log(websites);
    return await Promise.all(
      websites.map(async (website: Website) => {
        return await this.websiteConverter.convertToWebsiteResponseDto(website);
      }),
    );
  }

  async getWebsitesAssociatedWithClients(userType: string) {
    const users: UserResponseDto[] =
      await this.userService.fetchUsersByType(userType);

    return await Promise.all(
      users.map(async (user) => {
        const websites = await this.websiteModel
          .find({ userId: user.userId })
          .exec();

        const formattedWebsites = websites.map((website) => ({
          websiteId: website.id,
          baseUrl: website.baseUrl,
          additionalUrls: website.additionalUrls,
          websiteName: website.websiteName,
          description: website.description,
        }));

        return {
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          websites: formattedWebsites,
        };
      }),
    );
  }

  async addImagesInPattern(patternId: string, files: any) {
    const pattern = await this.websiteValidation.checkPatternExists(patternId);
    const bucketName = this.configService.get<string>('AWS_S3_BUCKET');

    const uploadPromises = files.map(async (file) => {
      const { originalname, buffer } = file;
      const fileId = uuid();
      const fileKey = `${fileId}_${originalname}`;
      const params = {
        Bucket: bucketName,
        Key: fileKey,
        Body: buffer,
      };
      await this.awsHelper.executePutObjectCommand(params);
      return fileKey;
    });

    try {
      const patternImageKeys = await Promise.all(uploadPromises);
      pattern.patternImageKeys.push(...patternImageKeys);
      await pattern.save();
      return { message: 'Images added successfully' };
    } catch (error) {
      this.logger.error(
        `Error while adding images in pattern : ${error.message}`,
      );
      throw new Error('Failed to upload files to S3');
    }
  }

  async getCertificationInS3Bucket() {
    const certificationBucketName = this.configService.get<string>(
      'AWS_S3_CERTIFICATION_BUCKET',
    );

    const params = {
      Bucket: certificationBucketName,
      Key: 'Digital_Certificate_VORT.svg',
    };

    return await this.awsHelper.executeGetObjectCommand(params);
  }

  async addPatternInWebsite(
    websiteId: string,
    patternCreateDto: PatternCreateDto,
  ) {
    await this.websiteValidation.checkUserExists(
      patternCreateDto.createdByExpertId,
    );
    const website = await this.websiteValidation.checkWebsiteExists(websiteId);

    if (!website.expertIds.includes(patternCreateDto.createdByExpertId)) {
      throw new HttpException(
        'Expert not assigned to the website',
        HttpStatus.BAD_REQUEST,
      );
    }

    const verifications = website.expertIds.map((expertId) => ({
      expertId: expertId,
      expertVerificationPhase: ExpertVerificationPhase.NotVerified,
    }));

    const newPattern: Pattern = new this.patternModel({
      patternType: patternCreateDto.patternType,
      websiteId: websiteId,
      isAutoGenerated: false,
      description: patternCreateDto.description,
      detectedUrl: patternCreateDto.detectedUrl,
      createdByExpertId: patternCreateDto.createdByExpertId,
      expertVerifications: verifications,
    });
    try {
      await newPattern.save();
      return { patternId: newPattern._id };
    } catch (error) {
      this.logger.error(
        `Error while adding pattern in website: ${error.message}`,
      );
      throw new HttpException(
        'Failed to save pattern details',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async addAutomatedPatternInWebsite(
    websiteId: string,
    patternCreateDtos: PatternCreateDto[],
  ) {
    const website = await this.websiteValidation.checkWebsiteExists(websiteId);
    const expertIds = patternCreateDtos.map(
      (patternCreateDto) => patternCreateDto.createdByExpertId,
    );

    const areExpertIdsSame = expertIds.every(
      (expertId) => expertId === expertIds[0],
    );

    if (!areExpertIdsSame) {
      throw new HttpException(
        'SuperAdmin can have only one createdByExpertId',
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = await this.websiteValidation.checkUserExists(expertIds[0]);

    if (user.role !== UserType.SuperAdmin) {
      throw new HttpException(
        'Only super admin can submit automated patterns',
        HttpStatus.BAD_REQUEST,
      );
    }

    const automatedPatterns = patternCreateDtos.map((patternDto) => {
      const verifications = website.expertIds.map((expertId) => ({
        expertId: expertId,
        expertVerificationPhase: ExpertVerificationPhase.NotVerified,
      }));

      const automatedPattern: Pattern = new this.patternModel({
        patternType: patternDto.patternType,
        websiteId: websiteId,
        isAutoGenerated: true,
        description: patternDto.description,
        detectedUrl: patternDto.detectedUrl,
        createdByExpertId: patternDto.createdByExpertId,
        expertVerifications: verifications,
      });

      return automatedPattern;
    });

    try {
      await this.patternModel.insertMany(automatedPatterns);
      return {
        message: `Automated patterns successfully added`,
      };
    } catch (error) {
      this.logger.error(
        `Error while adding automated pattern details: ${error.message}`,
      );
      throw new HttpException(
        'Failed to save pattern details',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async fetchAllPatternsOfWebsite(websiteId: string) {
    const patternList = await this.patternModel.find({ websiteId }).exec();
    return await Promise.all(
      patternList.map((pattern) =>
        this.websiteConverter.convertPatternToDto(pattern, false),
      ),
    );
  }

  async updatePatternPhaseByExpert(updatePatternPhase: UpdatePatternPhase) {
    const { websiteId, patternId, expertId, patternExists } =
      updatePatternPhase;

    const pattern = await this.patternModel
      .findOne({
        websiteId: websiteId,
        _id: patternId,
      })
      .exec();

    if (!pattern) {
      throw new HttpException('Pattern not found', HttpStatus.NOT_FOUND);
    }

    if (pattern.patternPhase === PatternPhaseType.Verified) {
      throw new HttpException('Pattern already verified', HttpStatus.NOT_FOUND);
    }

    const expertVerification = pattern.expertVerifications.find(
      (verification) => verification.expertId === expertId,
    );

    if (!expertVerification) {
      throw new HttpException(
        'Expert not assigned to given website',
        HttpStatus.BAD_REQUEST,
      );
    }

    expertVerification.expertVerificationPhase = patternExists
      ? ExpertVerificationPhase.VerifiedWithPattern
      : ExpertVerificationPhase.VerifiedWithoutPattern;

    const anyExpertVerificationNotVerified = pattern.expertVerifications.some(
      (verification) =>
        verification.expertVerificationPhase ===
        ExpertVerificationPhase.NotVerified,
    );

    pattern.patternPhase = anyExpertVerificationNotVerified
      ? PatternPhaseType.InProgress
      : PatternPhaseType.Verified;

    if (pattern.patternPhase === PatternPhaseType.Verified) {
      pattern.isPatternExists = pattern.expertVerifications.some(
        (verification) =>
          verification.expertVerificationPhase ===
          ExpertVerificationPhase.VerifiedWithPattern,
      );
    }

    pattern.markModified('expertVerifications');
    try {
      await pattern.save();
      return {
        message: `Pattern phase updated for pattern with id ${pattern._id}`,
      };
    } catch (error) {
      this.logger.error(
        `Error while updating pattern phase by expert: ${error.message}`,
      );
      throw new HttpException(
        'Failed to update pattern phase',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async addCommentToPattern(
    websiteId: string,
    patternId: string,
    commentCreateDto: CommentCreateDto,
  ) {
    await this.websiteValidation.checkUserExists(commentCreateDto.expertId);
    await this.websiteValidation.checkWebsiteExists(websiteId);
    await this.websiteValidation.checkPatternExists(patternId);

    const newComment = new this.commentModel({
      ...commentCreateDto,
      websiteId: websiteId,
      patternId: patternId,
    });

    try {
      const savedComment = await newComment.save();

      await this.patternModel.findByIdAndUpdate(
        patternId,
        { $push: { comments: savedComment } },
        { new: true },
      );

      return { commentId: savedComment._id };
    } catch (error) {
      this.logger.error(`Error while adding comment: ${error.message}`);
      throw new HttpException(
        'Failed to add comment',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async addUpVoteToWebsite(
    websiteId: string,
    userId: string,
  ){
    await this.websiteValidation.checkWebsiteExists(websiteId);
    const user = await this.websiteValidation.checkUserExists(userId);
    const userName = user.firstName + ' ' + user.lastName;

    try {
      const website = await this.websiteModel.findById(
        websiteId,
      )
      if (!website) {
        throw new HttpException('Website not found', HttpStatus.NOT_FOUND);
      }
      if(website.downVotes.includes(userName)){
        website.downVotes = website.downVotes.filter(name=>name!==userName)
      }
      website.upVotes.includes(userName) ? website.upVotes = website.upVotes.filter(name => name !== userName) : website.upVotes.push(userName);
      await website.save();
      this.logger.log(website)
      return {websiteUpvotes: website.upVotes, websiteDownvotes: website.downVotes, websiteId : website._id};
    } catch (error) {
      this.logger.error(`Error while adding the upvote: ${error.message}`);
      throw new HttpException(
        'Failed to upVote',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async addDownVoteToWebsite(
    websiteId: string,
    userId: string,
  ){
    await this.websiteValidation.checkWebsiteExists(websiteId);
    const user = await this.websiteValidation.checkUserExists(userId);
    const userName = user.firstName + ' ' + user.lastName;

    try {
      const website = await this.websiteModel.findById(
        websiteId,
      )
      if (!website) {
        throw new HttpException('Website not found', HttpStatus.NOT_FOUND);
      }
      if(website.upVotes.includes(userName)){
        website.upVotes = website.upVotes.filter(name => name !== userName);
      }
      website.downVotes.includes(userName) ? website.downVotes = website.downVotes.filter(name => name !== userName) : website.downVotes.push(userName);
      await website.save();
      this.logger.log(website)
      return {websiteDownvotes: website.downVotes, websiteUpvotes: website.upVotes, websiteId : website._id};
    } catch (error) {
      this.logger.error(`Error while adding the upvote: ${error.message}`);
      throw new HttpException(
        'Failed to upVote',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async addReplyToComment(
    websiteId: string,
    patternId: string,
    commentId: string,
    replyCreateDto: ReplyCreateDto,
  ) {
    await this.websiteValidation.checkUserExists(replyCreateDto.expertId);
    await this.websiteValidation.checkWebsiteExists(websiteId);
    await this.websiteValidation.checkPatternExists(patternId);
    await this.websiteValidation.checkCommentExists(commentId);

    try {
      const updatedComment = await this.commentModel.findByIdAndUpdate(
        commentId,
        { $push: { replies: { ...replyCreateDto, createdAt: new Date() } } },
        { new: true },
      );

      await this.patternModel.findByIdAndUpdate(
        patternId,
        { $set: { 'comments.$[elem]': updatedComment } },
        { arrayFilters: [{ 'elem._id': commentId }], new: true },
      );

      return { message: 'Reply successfully added' };
    } catch (error) {
      this.logger.error(`Error while adding reply: ${error.message}`);
      throw new HttpException(
        'Failed to add reply',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async fetchParticularPatternDetails(websiteId: string, patternId: string) {
    try {
      const pattern = await this.patternModel
        .findOne({
          _id: patternId,
          websiteId: websiteId,
        })
        .exec();

      if (!pattern) {
        throw new HttpException('Pattern not found', HttpStatus.NOT_FOUND);
      }
      return this.websiteConverter.convertPatternToDto(pattern, true);
    } catch (error) {
      this.logger.error(
        `Error while fetching particular pattern details: ${error.message}`,
      );
      throw new HttpException(
        'Failed to fetch pattern details',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async publishCertificationDetailsOfWebsite(
    websiteId: string,
    publishDto: PublishCertificationDto,
  ) {
    await this.websiteValidation.checkUserExists(publishDto.expertId);
    const website = await this.websiteValidation.checkWebsiteExists(websiteId);

    const client = await this.websiteValidation.checkUserExists(website.userId);

    if (website.isCompleted === true) {
      throw new HttpException(
        'Website is already published!!!',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (website.primaryExpertId !== publishDto.expertId) {
      throw new HttpException(
        'Expert doesnot have authority to publish the website certification details',
        HttpStatus.BAD_REQUEST,
      );
    }

    const patterns = await this.patternModel
      .find({ websiteId: websiteId })
      .exec();

    const isAllPatternsVerified = patterns.every(
      (pattern) => pattern.patternPhase === PatternPhaseType.Verified,
    );

    if (!isAllPatternsVerified) {
      throw new HttpException(
        'Not all patterns are verified by experts',
        HttpStatus.BAD_REQUEST,
      );
    }

    const anyPatternContainsDarkPattern = patterns.some(
      (pattern) => pattern.isPatternExists,
    );

    if (publishDto.isCertified && anyPatternContainsDarkPattern) {
      throw new HttpException(
        'Cannot provide certification to website containing dark pattern',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!publishDto.isCertified && !anyPatternContainsDarkPattern) {
      throw new HttpException(
        'Should provide certification to website free of dark patterns',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      !publishDto.isCertified &&
      (!publishDto.expertFeedback || !publishDto.expertFeedback.trim())
    ) {
      throw new HttpException(
        'Need to provide feedback for website containing dark pattern',
        HttpStatus.BAD_REQUEST,
      );
    }

    website.isDarkPatternFree = !anyPatternContainsDarkPattern;
    website.phase = WebsitePhaseType.Published;
    website.isCompleted = true;
    website.expertFeedback = publishDto.expertFeedback;

    try {
      const updatedWebsite = await website.save();
      await this.awsHelper.executeSendEmailCommand(client, updatedWebsite);
      return {
        message: `Certification details successfully published for website with id ${updatedWebsite._id}`,
      };
    } catch (error) {
      this.logger.error(
        `Error while publish website certification details: ${error.message}`,
      );
      throw new HttpException(
        'Failed to publish website certification details',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async fetchKpiForClient(clientId: string) {
    const user = await this.websiteValidation.checkUserExists(clientId);
    if (user.role !== UserType.Client) {
      throw new HttpException(
        'Client is only allowed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    const websites = await this.websiteModel.find({ userId: clientId }).exec();

    const totalWebsites = websites.length;

    const websitesInProgress = websites.filter(
      (website) => website.phase === WebsitePhaseType.InProgress,
    ).length;

    const websitesCertified = websites.filter(
      (website) =>
        website.phase === WebsitePhaseType.Published &&
        website.isDarkPatternFree,
    ).length;

    const websitesRejected = websites.filter(
      (website) =>
        website.phase === WebsitePhaseType.Published &&
        !website.isDarkPatternFree,
    ).length;

    return {
      totalWebsites,
      websitesInProgress,
      websitesCertified,
      websitesRejected,
    };
  }

  async fetchKpiForExpert(expertId: string) {
    const user = await this.websiteValidation.checkUserExists(expertId);
    if (user.role !== UserType.Expert) {
      throw new HttpException(
        'Expert is only allowed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const websites = await this.websiteModel
      .find({ expertIds: expertId })
      .exec();
    const totalWebsitesAssigned = websites.length;

    const totalInProgressWebsites = websites.filter(
      (website) => website.phase === WebsitePhaseType.InProgress,
    ).length;
    const totalPublishedWebsites = websites.filter(
      (website) => website.phase === WebsitePhaseType.Published,
    ).length;

    const patterns = await this.patternModel
      .find({ createdByExpertId: expertId })
      .exec();
    const totalPatternsCreated = patterns.length;

    return {
      totalWebsitesAssigned,
      totalInProgressWebsites,
      totalPublishedWebsites,
      totalPatternsCreated,
    };
  }

  async generateCertification(websiteId: string) {
    const website = await this.websiteValidation.checkWebsiteExists(websiteId);

    if (!website.isCompleted) {
      throw new HttpException(
        'Dark pattern check in progress website cannot be certified',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (website.isCompleted) {
      if (!website.isDarkPatternFree) {
        throw new HttpException(
          'Only dark pattern-free websites can be certified.',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    if (website.certificationId) {
      throw new HttpException(
        'The website is already certified and cannot be certified again.',
        HttpStatus.BAD_REQUEST,
      );
    }

    let certificationId: string;
    do {
      certificationId = generateCertificationId();
    } while (await this.websiteModel.findOne({ certificationId }));

    website.certificationId = certificationId;

    await website.save();
    return {
      certificationId: website.certificationId,
    };
  }
}
