import { User } from '../schemas/user.schema';
import { UserResponseDto } from '../dto/user-response.dto';

export function convertUserToDto(user: User): UserResponseDto {
  return {
    userId: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    subscription: user.subscription,
  };
}
