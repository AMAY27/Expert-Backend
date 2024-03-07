import { Date } from 'mongoose';
import { ReplyResponseDto } from './reply-response.dto';

export class CommentResponseDto {
  id: string;
  websiteId: string;
  patternId: string;
  expertId: string;
  expertName: string;
  content: string;
  createdAt: Date;
  replies: ReplyResponseDto[];
}
