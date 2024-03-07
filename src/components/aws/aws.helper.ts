import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { User } from '../user/schemas/user.schema';
import { Website } from '../website/schemas/website.schema';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AwsHelper {
  private readonly configService: ConfigService;
  private readonly logger = new Logger(AwsHelper.name);

  constructor(configService: ConfigService) {
    this.configService = configService;
  }

  private fetchAWSCredentials() {
    const region = this.configService.get<string>('AWS_REGION');
    const accessKey = this.configService.get<string>('AWS_ACCESS_KEY');
    const secretKey = this.configService.get<string>('AWS_SECRET_KEY');

    this.logger.log(
      `Fetching AWS Credential with Region: ${region}, AccessKey: ${accessKey}, Secretkey: ${secretKey}`,
    );
    return {
      region: region,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    };
  }

  private createS3Client() {
    this.logger.log(`Creating S3 Client`);
    const credentials = this.fetchAWSCredentials();
    return new S3Client(credentials);
  }

  private createSESClient() {
    this.logger.log(`Creating SES Client`);
    const awsCredentials = this.fetchAWSCredentials();
    return new SESClient(awsCredentials);
  }

  async executePutObjectCommand(params: any) {
    this.logger.log(`Executing PUT command in S3 bucket`);
    const s3Client = this.createS3Client();
    const putCommand = new PutObjectCommand(params);
    return await s3Client.send(putCommand);
  }

  async executeGetObjectCommand(params: any) {
    this.logger.log(`Executing GET command in S3 bucket`);
    const s3Client = this.createS3Client();
    const getCommand = new GetObjectCommand(params);
    return await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
  }

  async executeSendEmailCommand(client: User, website: Website) {
    this.logger.log(`Sending email to client with email: ${client.email}`);
    const sesClient = this.createSESClient();

    const to = client.email;
    const from = 'vtenet125@gmail.com';
    const subject = 'Website Published';
    const body = `
      <p>Dear ${client.firstName} ${client.lastName},</p>
      <p>Your website <strong>${website.websiteName}</strong> has been successfully published.</p>
      <p>To see more details, please visit the Vort homepage.</p>
      <p>Sincerely,<br/>The Vort Team</p>
    `;

    const sendEmailCommand = new SendEmailCommand({
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: body,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: subject,
        },
      },
      Source: from,
    });

    await sesClient.send(sendEmailCommand);
  }
}
