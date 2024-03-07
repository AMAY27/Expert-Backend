import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('Dark Pattern Detection APIs')
  .setDescription('Contains all the related backend APIs to the server side')
  .setVersion('1.0')
  .addBearerAuth()
  .build();
