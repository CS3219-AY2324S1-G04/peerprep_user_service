/**
 * @file Defines {@link UserProfile}.
 */

/** Represents a user's profile. */
export default class UserProfile {
  /** Unique ID. */
  public readonly userId?: number;

  /** Username. */
  public readonly username?: string;

  /** Email. */
  public readonly email?: string;

  /** Role. */
  public readonly role?: string;

  /**
   * @param userId - Unique ID.
   * @param username - Username.
   * @param email - Email.
   * @param role - Role.
   */
  public constructor(
    userId: number | undefined,
    username: string | undefined,
    email: string | undefined,
    role: string | undefined,
  ) {
    this.userId = userId;
    this.username = username;
    this.email = email;
    this.role = role;
  }
}
