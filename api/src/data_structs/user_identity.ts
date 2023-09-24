/**
 * @file Defines {@link UserIdentity}.
 */
import UserRole from '../enums/user_role';

/** Represents a user's identity. */
export default class UserIdentity {
  /** Unique ID. */
  public readonly userId?: number;

  /** Role. */
  public readonly role?: UserRole;

  /**
   * @param userId - Unique ID.
   * @param role - Role.
   */
  public constructor(userId: number | undefined, role: UserRole | undefined) {
    this.userId = userId;
    this.role = role;
  }
}
