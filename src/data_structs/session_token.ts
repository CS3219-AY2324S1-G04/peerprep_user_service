/**
 * @file Defines {@link SessionToken}.
 */
import { randomUUID } from 'crypto';

/** Session token. */
export default class SessionToken {
  private readonly _sessionToken: string;

  private constructor(sessionToken: string) {
    this._sessionToken = sessionToken;
  }

  /**
   * Parses {@link rawSessionToken} as a session token.
   * @param rawSessionToken - Value to parse.
   * @returns The parsed {@link SessionToken}.
   * @throws Error if parsing fails.
   */
  public static parse(rawSessionToken: unknown): SessionToken {
    if (!SessionToken._isString(rawSessionToken)) {
      throw new Error('Session token must be a string.');
    }

    if (
      !SessionToken._isStringSpecified(rawSessionToken as string | undefined)
    ) {
      throw new Error('Session token cannot be empty.');
    }

    return new SessionToken(rawSessionToken as string);
  }

  /** @returns Session token created with a random value. */
  public static create(): SessionToken {
    return new SessionToken(randomUUID());
  }

  private static _isString(rawSessionToken: unknown): boolean {
    return typeof rawSessionToken === 'string' || rawSessionToken === undefined;
  }

  private static _isStringSpecified(
    rawSessionToken: string | undefined,
  ): boolean {
    return rawSessionToken !== undefined && rawSessionToken.length > 0;
  }

  /** @returns String representation. */
  public toString(): string {
    return this._sessionToken;
  }
}
