/**
 * @file Defines {@link Username}.
 */

/** Username. */
export default class Username {
  private static _minLength: number = 3;
  private static _maxLength: number = 255;
  private static _charValidationRegex: RegExp = new RegExp('^[a-zA-Z0-9_]+$');

  private readonly _username: string;

  private constructor(username: string) {
    this._username = username;
  }

  /**
   * Parses {@link rawUsername} as a username.
   * @param rawUsername - Username.
   * @returns The parsed username.
   * @throws Error if parsing fails.
   */
  public static parse(
    rawUsername: string | qs.ParsedQs | string[] | qs.ParsedQs[] | undefined,
  ): Username {
    if (!Username._isUsernameString(rawUsername)) {
      throw new Error('Username must be a string.');
    }

    if (!Username._isUsernameSpecified(rawUsername as string | undefined)) {
      throw new Error('Username cannot be empty.');
    }

    return new Username(rawUsername as string);
  }

  /**
   * Parses {@link username} as a username then validates it.
   * @param rawUsername - Username.
   * @returns The parsed username.
   * @throws Error if parsing or validation fails.
   */
  public static parseAndValidate(
    rawUsername: string | qs.ParsedQs | string[] | qs.ParsedQs[] | undefined,
  ): Username {
    const username: Username = Username.parse(rawUsername);
    username.validate();
    return username;
  }

  private static _isUsernameString(
    rawUsername: string | qs.ParsedQs | string[] | qs.ParsedQs[] | undefined,
  ): boolean {
    return typeof rawUsername === 'string' || rawUsername === undefined;
  }

  private static _isUsernameSpecified(
    rawUsername: string | undefined,
  ): boolean {
    return rawUsername !== undefined && rawUsername.length > 0;
  }

  /**
   * Validates the username.
   * @throws Error if the username is invalid.
   */
  public validate(): void {
    if (this._isUsernameTooShort()) {
      throw new Error(
        `Username must be at least ${Username._minLength} characters long.`,
      );
    }

    if (this._isUsernameTooLong()) {
      throw new Error(
        `Username cannot exceed ${Username._maxLength} characters.`,
      );
    }

    if (!this._isUsernameCharsValid()) {
      throw new Error(
        "Username can only contain '_' or alphanumeric characters.",
      );
    }
  }

  public toString(): string {
    return this._username;
  }

  private _isUsernameTooShort() {
    return this._username.length < Username._minLength;
  }

  private _isUsernameTooLong() {
    return this._username.length > Username._maxLength;
  }

  private _isUsernameCharsValid() {
    return Username._charValidationRegex.test(this._username);
  }
}
