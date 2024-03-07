import { BadRequestException } from '@nestjs/common';

export class DuplicateKeyException extends BadRequestException {
  constructor(message: string, statusCode: number) {
    super({ message, statusCode });
  }
}
