/**
 * @file Defines {@link SessionToken}.
 */
import { randomUUID } from 'crypto';

/** Session token. */
export default class SessionToken {
  public readonly sessionToken: string;

  private constructor(sessionToken: string) {
    this.sessionToken = sessionToken;
  }

  /**
   * Parses {@link rawSessionToken} as a session token.
   * @param rawSessionToken - Session token.
   * @returns The parsed {@link SessionToken}.
   * @throws Error if parsing fails.
   */
  public static parse(
    rawSessionToken:
      | string
      | qs.ParsedQs
      | string[]
      | qs.ParsedQs[]
      | undefined,
  ): SessionToken {
    if (!SessionToken._isSessionTokenString(rawSessionToken)) {
      throw new Error('Session token must be a string.');
    }

    if (
      !SessionToken._isSessionTokenSpecified(
        rawSessionToken as string | undefined,
      )
    ) {
      throw new Error('Session token cannot be empty.');
    }

    return new SessionToken(rawSessionToken as string);
  }

  public static createNew(): SessionToken {
    return new SessionToken(randomUUID());
  }

  private static _isSessionTokenString(
    rawSessionToken:
      | string
      | qs.ParsedQs
      | string[]
      | qs.ParsedQs[]
      | undefined,
  ): boolean {
    return typeof rawSessionToken === 'string' || rawSessionToken === undefined;
  }

  private static _isSessionTokenSpecified(
    rawSessionToken: string | undefined,
  ): boolean {
    return rawSessionToken !== undefined && rawSessionToken.length > 0;
  }

  public toString(): string {
    return this.sessionToken;
  }
}
