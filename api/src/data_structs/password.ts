/**
 * @file Defines {@link Password}.
 */

/** Password. */
export default class Password {
  private static _minLength: number = 8;
  private static _maxLength: number = 255;

  private static _lowerCaseAlphabets: string = 'abcdefghijklmnopqrstuvwxyz';
  private static _upperCaseAlphabets: string =
    Password._lowerCaseAlphabets.toUpperCase();
  private static _numerics: string = '0123456789';
  private static _specialCharacters: string = '!@#$%^&*';
  private static _validCharacters: string =
    Password._lowerCaseAlphabets +
    Password._upperCaseAlphabets +
    Password._numerics +
    Password._specialCharacters;

  public readonly password: string;

  private constructor(password: string) {
    this.password = password;
  }

  /**
   * Parses {@link rawPassword} as a password.
   * @param rawPassword - Password.
   * @returns The parsed {@link Password}.
   * @throws Error if parsing fails.
   */
  public static parse(
    rawPassword: string | qs.ParsedQs | string[] | qs.ParsedQs[] | undefined,
  ): Password {
    if (!Password._isPasswordString(rawPassword)) {
      throw new Error('Password must be a string.');
    }

    if (!Password._isPasswordSpecified(rawPassword as string | undefined)) {
      throw new Error('Password cannot be empty.');
    }

    return new Password(rawPassword as string);
  }

  /**
   * Parses {@link rawPassword} as a password then validates it.
   * @param rawPassword - Password.
   * @returns The parsed password.
   * @throws Error if parsing or validation fails.
   */
  public static parseAndValidate(
    rawPassword: string | qs.ParsedQs | string[] | qs.ParsedQs[] | undefined,
  ): Password {
    const password: Password = Password.parse(rawPassword);
    password.validate();
    return password;
  }

  private static _isPasswordString(
    rawPassword: string | qs.ParsedQs | string[] | qs.ParsedQs[] | undefined,
  ): boolean {
    return typeof rawPassword === 'string' || rawPassword === undefined;
  }

  private static _isPasswordSpecified(
    rawPassword: string | undefined,
  ): boolean {
    return rawPassword !== undefined && rawPassword.length > 0;
  }

  /**
   * Validates the password.
   * @throws Error if the password is invalid.
   */
  public validate(): void {
    if (this._isPasswordTooShort()) {
      throw new Error(
        `Password must be at least ${Password._minLength} characters long.`,
      );
    }

    if (this._isPasswordTooLong()) {
      throw new Error(
        `Password cannot exceed ${Password._maxLength} characters.`,
      );
    }

    if (!this._arePasswordCharactersValid()) {
      throw new Error(
        `Password can only contain ${Password._specialCharacters} or alphanumeric characters.`,
      );
    }

    if (!this._doesPasswordHaveRequiredCharacters()) {
      throw new Error(
        `Password must contain at least one uppercase alphabet, one lowercase alphabet, one numeric character, and one of the following: ${Password._specialCharacters}`,
      );
    }
  }

  public toString(): string {
    return this.password;
  }

  private _isPasswordTooShort(): boolean {
    return this.password.length < Password._minLength;
  }

  private _isPasswordTooLong(): boolean {
    return this.password.length > Password._maxLength;
  }

  private _arePasswordCharactersValid(): boolean {
    return !RegExp(`[^${Password._validCharacters}]`).test(this.password);
  }

  private _doesPasswordHaveRequiredCharacters(): boolean {
    return (
      RegExp(`[${Password._lowerCaseAlphabets}]`).test(this.password) &&
      RegExp(`[${Password._upperCaseAlphabets}]`).test(this.password) &&
      RegExp(`[${Password._numerics}]`).test(this.password) &&
      RegExp(`[${Password._specialCharacters}]`).test(this.password)
    );
  }
}
