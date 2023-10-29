/**
 * @file Defines {@link UserId}.
 */

/** User ID. */
export default class UserId {
  private static _regex: RegExp = RegExp('^[1-9][0-9]*$');

  private readonly _userId: number;

  public constructor(userId: number) {
    this._userId = userId;
  }

  /**
   * Parses {@link rawUserId} as a user ID.
   * @param rawUserId - User ID.
   * @returns The parsed {@link UserId}.
   * @throws Error if parsing fails.
   */
  public static parseString(rawUserId: string | undefined): UserId {
    if (!UserId._isUserIdStringSpecified(rawUserId)) {
      throw new Error('User ID cannot be empty.');
    }

    if (!UserId._isUserIdStringPositiveInteger(rawUserId!)) {
      throw new Error('User ID must be a positive integer.');
    }

    return new UserId(parseInt(rawUserId!, 10));
  }

  /**
   * Parses {@link rawUserId} as a user ID.
   * @param rawUserId - User ID.
   * @returns The parsed {@link UserId}.
   * @throws Error if parsing fails.
   */
  public static parseNumber(rawUserId: number | undefined): UserId {
    if (rawUserId === undefined) {
      throw new Error('User ID cannot be empty.');
    }

    if (rawUserId <= 0) {
      throw new Error('User ID must be a positive integer.');
    }

    return new UserId(rawUserId);
  }

  private static _isUserIdStringSpecified(
    rawUserId: string | undefined,
  ): boolean {
    return rawUserId !== undefined && rawUserId.length > 0;
  }

  private static _isUserIdStringPositiveInteger(rawUserId: string): boolean {
    return UserId._regex.test(rawUserId);
  }

  public toString(): string {
    return this._userId.toString();
  }

  public toNumber(): number {
    return this._userId;
  }
}
