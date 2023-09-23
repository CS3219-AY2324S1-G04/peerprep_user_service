/**
 * @file Defines {@link UserIdentity}.
 */

/** Represents a user's identity. */
export default class UserIdentity {
  /** Unique ID. */
  public readonly userId?: number;

  /** Role. */
  public readonly role?: string;

  /**
   * @param userId - Unique ID.
   * @param role - Role.
   */
  public constructor(userId: number | undefined, role: string | undefined) {
    this.userId = userId;
    this.role = role;
  }
}
