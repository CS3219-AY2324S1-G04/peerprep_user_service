/**
 * @file Defines {@link UserId}.
 */

/** User ID. */
export default class UserId {
  private static _regex: RegExp = RegExp('^[1-9][0-9]*$');

  public readonly userId: number;

  public constructor(userId: number) {
    this.userId = userId;
  }

  /**
   * Parses {@link userId} as a user ID.
   * @param userId - User ID.
   * @returns The parsed {@link UserId}.
   * @throws Error if parsing fails.
   */
  public static parseString(userId: string): UserId {
    if (!UserId._isUserIdSpecified(userId)) {
      throw new Error('User ID cannot be empty.');
    }

    if (!UserId._isUserIdPositiveInteger(userId)) {
      throw new Error('User ID must be a positive integer.');
    }

    return new UserId(parseInt(userId, 10));
  }

  /**
   * Parses {@link userId} as a user ID.
   * @param userId - User ID.
   * @returns The parsed {@link UserId}.
   * @throws Error if parsing fails.
   */
  public static parseNumber(userId: number): UserId {
    if (userId <= 0) {
      throw new Error('User ID must be a positive integer.');
    }

    return new UserId(userId);
  }

  private static _isUserIdSpecified(userId: string): boolean {
    return userId.length > 0;
  }

  private static _isUserIdPositiveInteger(userId: string): boolean {
    return UserId._regex.test(userId);
  }

  public toString(): string {
    return this.userId.toString();
  }

  public toNumber(): number {
    return this.userId;
  }
}
