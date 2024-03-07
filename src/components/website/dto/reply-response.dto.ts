import { Date } from 'mongoose';

export class ReplyResponseDto {
  expertId: string;
  expertName: string;
  content: string;
  createdAt: Date;
}
