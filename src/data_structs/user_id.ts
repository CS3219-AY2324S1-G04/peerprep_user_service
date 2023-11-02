/**
 * @file Defines {@link UserId}.
 */

/** User ID. */
export default class UserId {
  private static _positiveIntegerStringRegex: RegExp = RegExp('^[1-9][0-9]*$');

  private readonly _userId: number;

  public constructor(userId: number) {
    this._userId = userId;
  }

  /**
   * Parses a string {@link rawUserId} as a user ID.
   * @param rawUserId - Value to parse.
   * @returns The parsed {@link UserId}.
   * @throws Error if parsing fails.
   */
  public static parseString(rawUserId: string | undefined): UserId {
    if (rawUserId === undefined || rawUserId.length === 0) {
      throw new Error('User ID cannot be empty.');
    }

    if (!UserId._positiveIntegerStringRegex.test(rawUserId)) {
      throw new Error('User ID must be a positive integer.');
    }

    return new UserId(parseInt(rawUserId!, 10));
  }

  /**
   * Parses a number {@link rawUserId} as a user ID.
   * @param rawUserId - Value to parse.
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

  public toString(): string {
    return this._userId.toString();
  }

  public toNumber(): number {
    return this._userId;
  }
}
