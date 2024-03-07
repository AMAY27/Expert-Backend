import { WebsitePhaseType } from '../enum/website-phase.enum';
import { Date } from 'mongoose';

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
  createdAt: Date;
  certificationId: string;
}

export class ExpertDetailsDto {
  id: string;
  name: string;
}
