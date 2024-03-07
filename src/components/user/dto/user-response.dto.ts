import { Date } from 'mongoose';

export class UserResponseDto {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: Date;
  subscription: string;
}
