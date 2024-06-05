import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Date, Document } from 'mongoose';
import { WebsitePhaseType } from '../enum/website-phase.enum';

@Schema()
export class Website extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  baseUrl: string;

  @Prop({ required: true })
  websiteName: string;

  @Prop()
  additionalUrls: string[];

  @Prop()
  description: string;

  @Prop({ default: false })
  isCompleted: boolean;

  @Prop({ default: WebsitePhaseType.InProgress, enum: WebsitePhaseType })
  phase: WebsitePhaseType;

  @Prop()
  isDarkPatternFree: boolean;

  @Prop()
  expertFeedback: string;

  @Prop()
  expertIds: string[];

  @Prop()
  primaryExpertId: string;

  @Prop({ default: Date.now, type: Date })
  createdAt: Date;

  @Prop({ unique: true, sparse: true })
  certificationId: string;

  @Prop()
  upVotes: string[];

  @Prop()
  downVotes: string[];
}

export const WebsiteSchema = SchemaFactory.createForClass(Website);
