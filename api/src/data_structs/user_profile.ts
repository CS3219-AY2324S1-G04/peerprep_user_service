/**
 * @file Defines {@link UserProfile}.
 */
import UserRole from '../enums/user_role';
import UserIdentity from './user_identity';

/** Represents a user's profile. */
export default class UserProfile extends UserIdentity {
  /** Username. */
  public readonly username?: string;

  /** Email. */
  public readonly email?: string;

  /**
   * @param userId - Unique ID.
   * @param username - Username.
   * @param email - Email.
   * @param role - User role.
   */
  public constructor(
    userId: number | undefined,
    username: string | undefined,
    email: string | undefined,
    role: UserRole | undefined,
  ) {
    super(userId, role);
    this.username = username;
    this.email = email;
  }
}
