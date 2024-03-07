import { ExpertVerificationPhase } from '../enum/expert-verification-phase.enum';

export class ExpertVerificationDto {
  expertId: string;
  expertName: string;
  expertVerificationPhase: ExpertVerificationPhase;
}
