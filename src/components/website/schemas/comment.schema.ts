import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Date, Document } from 'mongoose';

export class Reply {
  @Prop({ required: true })
  expertId: string;

  @Prop({ required: true })
  content: string;

  @Prop({ default: Date.now, type: Date })
  createdAt: Date;
}

@Schema()
export class Comment extends Document {
  @Prop({ required: true })
  websiteId: string;

  @Prop({ required: true })
  patternId: string;

  @Prop({ required: true })
  expertId: string;

  @Prop({ required: true })
  content: string;

  @Prop({ default: Date.now, type: Date })
  createdAt: Date;

  @Prop({ type: [Reply] })
  replies: Reply[];
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
