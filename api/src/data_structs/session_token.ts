/**
 * @file Defines {@link SessionToken}.
 */
import { v4 as uuidV4 } from 'uuid';

/** Session token. */
export default class SessionToken {
  public readonly token: string;

  private constructor(token: string) {
    this.token = token;
  }

  /**
   * Parses {@link rawToken} as a session token.
   * @param rawToken - Session token.
   * @returns The parsed {@link SessionToken}.
   * @throws Error if parsing fails.
   */
  public static parse(
    rawToken: string | qs.ParsedQs | string[] | qs.ParsedQs[] | undefined,
  ): SessionToken {
    if (!SessionToken._isTokenString(rawToken)) {
      throw new Error('Session token must be a string.');
    }

    if (!SessionToken._isTokenSpecified(rawToken as string | undefined)) {
      throw new Error('Session token cannot be empty.');
    }

    return new SessionToken(rawToken as string);
  }

  public static createNew(): SessionToken {
    return new SessionToken(uuidV4());
  }

  private static _isTokenString(
    rawToken: string | qs.ParsedQs | string[] | qs.ParsedQs[] | undefined,
  ): boolean {
    return typeof rawToken === 'string' || rawToken === undefined;
  }

  private static _isTokenSpecified(rawToken: string | undefined): boolean {
    return rawToken !== undefined && rawToken.length > 0;
  }

  public toString(): string {
    return this.token;
  }
}
