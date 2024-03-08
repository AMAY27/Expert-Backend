import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { swaggerConfig } from './config/swagger.config';
import * as process from 'process';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const nodeEnv = process.env.NODE_ENV || 'prod';
  const envFilePath = `.env.${nodeEnv}`;
  logger.log(
    `Selected environment: ${nodeEnv} and Selected env file path: ${envFilePath}`,
  );

  dotenv.config({ path: envFilePath });

  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  const configService = app.get(ConfigService);
  app.enableCors({
    origin: 'http://localhost:3000', // Allow requests from this origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Allow these HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow these headers
    credentials: true, // Allow sending credentials (e.g., cookies, authorization headers)
    preflightContinue: false, // Disable preflight requests cache
    optionsSuccessStatus: 200, // Response status for successful OPTIONS requests
    maxAge: 3600, // How long the results of a preflight request can be cached in seconds
  });

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(configService.get<number>('APP_PORT'));
}
bootstrap();
