import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { WebsiteCreateDto } from './dto/website-create.dto';
import { WebsiteService } from './website.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/roles.decorator';
import { UserType } from 'src/components/user/enum/user-type.enum';
import { PatternCreateDto } from './dto/pattern-create.dto';
import { CommentCreateDto } from './dto/comment-create.dto';
import { ReplyCreateDto } from './dto/reply-create.dto';
import { AssignExpertsDto } from './dto/assign-experts.dto';
import { UpdatePatternPhase } from './dto/update-pattern-phase.dto';
import { PublishCertificationDto } from './dto/publish-certification.dto';
import { FilesInterceptor } from '@nestjs/platform-express';

@ApiTags('Website')
@ApiBearerAuth()
@Controller('website')
export class WebsiteController {
  private readonly logger = new Logger(WebsiteController.name);
  constructor(private readonly websiteService: WebsiteService) {}

  @Post()
  @UseGuards(AuthGuard)
  @Roles(UserType.Expert)
  @ApiOperation({
    summary: 'Create a new website [For Client]',
    description: 'Persist details of a new website for a user.',
  })
  async persistWebsiteDetails(@Body() websiteCreateDto: WebsiteCreateDto) {
    this.logger.log(`Save new website details`);
    return await this.websiteService.persistWebsiteDetails(websiteCreateDto);
  }

  @Put(':websiteId/assignExperts')
  @UseGuards(AuthGuard)
  @Roles(UserType.SuperAdmin)
  @ApiOperation({
    summary: 'Assign experts to website [For SuperAdmin]',
  })
  async assignExperts(
    @Param('websiteId') websiteId: string,
    @Body() assignExpertsDto: AssignExpertsDto,
  ) {
    this.logger.log(`Assign experts to website`);
    return await this.websiteService.assignExpertsToWebsite(
      websiteId,
      assignExpertsDto,
    );
  }

  @Get(':websiteId')
  @UseGuards(AuthGuard)
  @Roles(UserType.Client, UserType.Expert, UserType.SuperAdmin)
  @ApiOperation({
    summary: 'Fetch details of a website [For Client/Expert/SuperAdmin]',
    description: 'Retrieve details of a specific website based on its ID.',
  })
  async fetchParticularWebsiteDetails(@Param('websiteId') websiteId: string) {
    this.logger.log(`Fetching website details with id: ${websiteId}`);
    return await this.websiteService.fetchParticularWebsiteDetails(websiteId);
  }

  @Get()
  @UseGuards(AuthGuard)
  @Roles(UserType.Client, UserType.Expert)
  @ApiOperation({
    summary: 'Get all websites for a user [For Client/Expert]',
    description:
      'Retrieve details of all websites associated with a specific user(Client or Expert).',
  })
  async getAllWebsiteDetailsForParticularUser(@Query('userId') userId: string) {
    this.logger.log(`Fetch all website details for user with id: ${userId}`);
    return await this.websiteService.getAllWebsiteDetailsForParticularUser(
      userId,
    );
  }

  @Get(':userType/details')
  @UseGuards(AuthGuard)
  @Roles(UserType.SuperAdmin)
  @ApiOperation({
    summary: 'Get websites details associated with clients [For SuperAdmin]',
    description: 'Retrieve details of all websites associated with clients',
  })
  async getAllWebsitesAssociatedWithClients(
    @Param('userType') userType: string,
  ) {
    this.logger.log(`Retrieve all websites associated with clients`);
    return await this.websiteService.getWebsitesAssociatedWithClients(userType);
  }

  @Put(':websiteId/pattern')
  @UseGuards(AuthGuard)
  @Roles(UserType.Expert)
  @ApiOperation({
    summary: 'Add pattern in a website [For Expert]',
    description: 'Persist details of a new pattern for a website',
  })
  async addPatternInWebsite(
    @Param('websiteId') websiteId: string,
    @Body() patternCreateDto: PatternCreateDto,
  ) {
    this.logger.log(`Add pattern in website with id: ${websiteId}`);
    return await this.websiteService.addPatternInWebsite(
      websiteId,
      patternCreateDto,
    );
  }

  @Put(':patternId/uploadImages')
  @UseGuards(AuthGuard)
  @Roles(UserType.Expert)
  @ApiOperation({
    summary: 'Add images for the detected pattern [For Expert]',
  })
  @UseInterceptors(FilesInterceptor('files'))
  async addImageInPattern(
    @Param('patternId') patternId: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    this.logger.log(`Add images in pattern with id: ${patternId}`);
    return await this.websiteService.addImagesInPattern(patternId, files);
  }

  @Get(':imageId/certificationImageFetch')
  @ApiOperation({
    summary: 'Get Certification Image [For Client]',
  })
  async getCertificationImage() {
    this.logger.log('Get certification image in S3 Bucket');
    return await this.websiteService.getCertificationInS3Bucket();
  }

  @Put(':websiteId/automatedPatterns')
  @UseGuards(AuthGuard)
  @Roles(UserType.SuperAdmin)
  @ApiOperation({
    summary: 'Add automated pattern in a website [For SuperAdmin]',
  })
  @ApiBody({ type: [PatternCreateDto] })
  async addAutomatedPatternInWebsite(
    @Param('websiteId') websiteId: string,
    @Body() patternCreateDtos: PatternCreateDto[],
  ) {
    this.logger.log(
      `Add AI model generated patterns in website with id:  ${websiteId}`,
    );
    return await this.websiteService.addAutomatedPatternInWebsite(
      websiteId,
      patternCreateDtos,
    );
  }

  @Get(':websiteId/pattern')
  @UseGuards(AuthGuard)
  @Roles(UserType.Client, UserType.Expert)
  @ApiOperation({
    summary: 'Fetch all patterns details of a website [For Client/Expert]',
    description: 'Fetch all patterns details of a particular website',
  })
  async fetchAllPatternsOfWebsite(@Param('websiteId') websiteId: string) {
    this.logger.log(`Retrieve all patterns for website with id: ${websiteId}`);
    return await this.websiteService.fetchAllPatternsOfWebsite(websiteId);
  }

  @Put('updatePatternPhase')
  @UseGuards(AuthGuard)
  @Roles(UserType.Expert)
  @ApiOperation({
    summary: 'Update pattern phase [For Expert]',
    description: 'Update pattern phase of particular pattern',
  })
  async updatePatternPhaseByExpert(
    @Body() updatePatternPhase: UpdatePatternPhase,
  ) {
    this.logger.log(`Update pattern phase`);
    return await this.websiteService.updatePatternPhaseByExpert(
      updatePatternPhase,
    );
  }

  @Post(':websiteId/pattern/:patternId/comment')
  @UseGuards(AuthGuard)
  @Roles(UserType.Expert)
  @ApiOperation({
    summary: 'Add comment to pattern [For Expert]',
    description: 'Persist new comment to a pattern for a website',
  })
  async addCommentToPattern(
    @Param('websiteId') websiteId: string,
    @Param('patternId') patternId: string,
    @Body() commentCreateDto: CommentCreateDto,
  ) {
    this.logger.log(`Add comment to pattern with id : ${patternId}`);
    return await this.websiteService.addCommentToPattern(
      websiteId,
      patternId,
      commentCreateDto,
    );
  }

  @Post(':websiteId/pattern/:patternId/comment/:commentId/reply')
  @UseGuards(AuthGuard)
  @Roles(UserType.Expert)
  @ApiOperation({
    summary: 'Add reply to a comment [For Expert]',
    description: 'Persist reply to a comment of a pattern in a website',
  })
  async addReplyToComment(
    @Param('websiteId') websiteId: string,
    @Param('patternId') patternId: string,
    @Param('commentId') commentId: string,
    @Body() replyCreateDto: ReplyCreateDto,
  ) {
    this.logger.log(`Add reply to comment with id: ${commentId}`);
    return await this.websiteService.addReplyToComment(
      websiteId,
      patternId,
      commentId,
      replyCreateDto,
    );
  }

  @Get(':websiteId/pattern/:patternId')
  @UseGuards(AuthGuard)
  @Roles(UserType.Expert)
  @ApiOperation({
    summary: 'Fetch particular pattern details [For Expert]',
    description: 'Retrieve details of particular pattern of a website',
  })
  async fetchPatternDetails(
    @Param('websiteId') websiteId: string,
    @Param('patternId') patternId: string,
  ) {
    this.logger.log(`Fetch pattern details with id: ${patternId}`);
    return await this.websiteService.fetchParticularPatternDetails(
      websiteId,
      patternId,
    );
  }

  @Put(':websiteId/publish')
  @UseGuards(AuthGuard)
  @Roles(UserType.Expert)
  @ApiOperation({
    summary: 'Publish certification/feedback for a website [For Expert]',
    description: 'Publish final feedback or certification for a website',
  })
  async publishWebsiteCertification(
    @Param('websiteId') websiteId: string,
    @Body() publishDto: PublishCertificationDto,
  ) {
    this.logger.log(`Publish certification for website with id :${websiteId}`);
    return await this.websiteService.publishCertificationDetailsOfWebsite(
      websiteId,
      publishDto,
    );
  }

  @Get('clientKpi/:clientId')
  @UseGuards(AuthGuard)
  @Roles(UserType.Client)
  @ApiOperation({
    summary: 'Fetch KPI for a client [For Client]',
    description: 'Retrieve KPI of all websites  associated with a client',
  })
  async getKpiForClient(@Param('clientId') clientId: string) {
    this.logger.log(`Fetch KPI for client with id: ${clientId}`);
    return await this.websiteService.fetchKpiForClient(clientId);
  }

  @Get('expertKpi/:expertId')
  @UseGuards(AuthGuard)
  @Roles(UserType.Expert)
  @ApiOperation({
    summary: 'Fetch KPI for a expert [For Expert]',
    description: 'Retrieve KPI of all websites  associated with a expert',
  })
  async getKpiForExpert(@Param('expertId') expertId: string) {
    this.logger.log(`Fetch KPI for expert with id: ${expertId}`);
    return await this.websiteService.fetchKpiForExpert(expertId);
  }

  @Get(':websiteId/generateCertification')
  @UseGuards(AuthGuard)
  @Roles(UserType.Client)
  @ApiOperation({
    summary:
      'Generate Certification for dark pattern free websites [For Client]',
  })
  async generateWebsiteCertification(@Param('websiteId') websiteId: string) {
    this.logger.log(`Generate certification for website with id: ${websiteId}`);
    return await this.websiteService.generateCertification(websiteId);
  }
}
