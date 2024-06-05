import { WebsitePhaseType } from '../enum/website-phase.enum';
import { Date } from 'mongoose';
import { PatternResponseDto } from './pattern-response.dto';

export class WebsiteResponseDto {
  websiteId: string;
  baseUrl: string;
  websiteName: string;
  userId: string;
  additionalUrls: string[];
  description: string;
  isCompleted: boolean;
  phase: WebsitePhaseType;
  isDarkPatternFree: boolean;
  expertFeedback: string;
  expertDetails: ExpertDetailsDto[];
  primaryExpertId: string;
  contributorName: string;
  createdAt: Date;
  certificationId: string;
  patternDetails: PatternResponseDto[];
  upVotes: string[];
  downVotes: string[];
}

export class ExpertDetailsDto {
  id: string;
  name: string;
}
