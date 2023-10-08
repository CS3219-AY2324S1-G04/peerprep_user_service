/**
 * @file Defines {@link EmailAddress}.
 */

/** Email address. */
export default class EmailAddress {
  private static _maxLength: number = 255;

  private static _domainEdgeChars: string = '[a-zA-Z0-9]';
  private static _domainChars: string = '[a-zA-Z0-9\\-]';
  private static _domainLabelRegexStr: string = `${EmailAddress._domainEdgeChars}(${EmailAddress._domainChars}*${EmailAddress._domainEdgeChars}+)*`;
  private static _domainRegexStr: string = `${EmailAddress._domainLabelRegexStr}(\\.${EmailAddress._domainLabelRegexStr})+`;

  private static _emailLocalPartChars: string =
    "[a-zA-Z0-9!#$%&'*+\\-/=?^_`{|}~]";
  private static _emailRegex: RegExp = RegExp(
    `^${EmailAddress._emailLocalPartChars}+(\\.${EmailAddress._emailLocalPartChars}+)*@${EmailAddress._domainRegexStr}$`,
  );

  public readonly email: string;

  private constructor(email: string) {
    this.email = email.toLowerCase();
  }

  /**
   * Parses {@link rawEmail} as an {@link EmailAddress}.
   * @param rawEmail - Email address.
   * @returns The parsed {@link EmailAddress}.
   * @throws Error if parsing fails.
   */
  public static parse(
    rawEmail: string | qs.ParsedQs | string[] | qs.ParsedQs[] | undefined,
  ): EmailAddress {
    if (!EmailAddress._isEmailAddressString(rawEmail)) {
      throw new Error('Email must be a string.');
    }

    if (
      !EmailAddress._isEmailAddressSpecified(rawEmail as string | undefined)
    ) {
      throw new Error('Email cannot be empty.');
    }

    return new EmailAddress(rawEmail as string);
  }

  /**
   * Parses {@link rawEmail} as an {@link EmailAddress} then validates it.
   * @param rawEmail - Email address.
   * @returns The parsed {@link EmailAddress}.
   * @throws Error if parsing or validation fails.
   */
  public static parseAndValidate(
    rawEmail: string | qs.ParsedQs | string[] | qs.ParsedQs[] | undefined,
  ): EmailAddress {
    const email: EmailAddress = EmailAddress.parse(rawEmail);
    email.validate();
    return email;
  }

  private static _isEmailAddressString(
    rawEmail: string | qs.ParsedQs | string[] | qs.ParsedQs[] | undefined,
  ): boolean {
    return typeof rawEmail === 'string' || rawEmail === undefined;
  }

  private static _isEmailAddressSpecified(
    rawEmail: string | undefined,
  ): boolean {
    return rawEmail !== undefined && rawEmail.length > 0;
  }

  /**
   * Validates the email address.
   * @throws Error if the email address is invalid.
   */
  public validate() {
    if (this._isEmailAddressTooLong()) {
      throw new Error(
        `Email cannot exceed ${EmailAddress._maxLength} characters.`,
      );
    }

    if (!this._isEmailAddressFormatCorrect()) {
      throw new Error('Email is invalid.');
    }
  }

  public toString(): string {
    return this.email;
  }

  private _isEmailAddressTooLong() {
    return this.email.length > EmailAddress._maxLength;
  }

  private _isEmailAddressFormatCorrect() {
    return EmailAddress._emailRegex.test(this.email);
  }
}
