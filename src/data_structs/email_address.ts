/**
 * @file Defines {@link EmailAddress}.
 */
/** Email address. */
export default class EmailAddress {
  private static _maxLength: number = 255;
  private static _emailAddressFormatRegex: RegExp =
    getEmailAddressFormatRegex();

  private readonly _emailAddress: string;

  private constructor(emailAddress: string) {
    this._emailAddress = emailAddress.toLowerCase();
  }

  /**
   * Parses {@link rawEmailAddress} as an {@link EmailAddress}.
   * @param rawEmailAddress - Email address.
   * @returns The parsed {@link EmailAddress}.
   * @throws Error if parsing fails.
   */
  public static parse(
    rawEmailAddress:
      | string
      | qs.ParsedQs
      | string[]
      | qs.ParsedQs[]
      | undefined,
  ): EmailAddress {
    if (!EmailAddress._isEmailAddressString(rawEmailAddress)) {
      throw new Error('Email address must be a string.');
    }

    if (
      !EmailAddress._isEmailAddressSpecified(
        rawEmailAddress as string | undefined,
      )
    ) {
      throw new Error('Email address cannot be empty.');
    }

    return new EmailAddress(rawEmailAddress as string);
  }

  /**
   * Parses {@link rawEmailAddress} as an {@link EmailAddress} then validates
   * it.
   * @param rawEmailAddress - Email address.
   * @returns The parsed {@link EmailAddress}.
   * @throws Error if parsing or validation fails.
   */
  public static parseAndValidate(
    rawEmailAddress:
      | string
      | qs.ParsedQs
      | string[]
      | qs.ParsedQs[]
      | undefined,
  ): EmailAddress {
    const emailAddress: EmailAddress = EmailAddress.parse(rawEmailAddress);
    emailAddress.validate();
    return emailAddress;
  }

  private static _isEmailAddressString(
    rawEmailAddress:
      | string
      | qs.ParsedQs
      | string[]
      | qs.ParsedQs[]
      | undefined,
  ): boolean {
    return typeof rawEmailAddress === 'string' || rawEmailAddress === undefined;
  }

  private static _isEmailAddressSpecified(
    rawEmailAddress: string | undefined,
  ): boolean {
    return rawEmailAddress !== undefined && rawEmailAddress.length > 0;
  }

  /**
   * Validates the email address.
   * @throws Error if the email address is invalid.
   */
  public validate() {
    if (this._isEmailAddressTooLong()) {
      throw new Error(
        `Email address cannot exceed ${EmailAddress._maxLength} characters.`,
      );
    }

    if (!this._isEmailAddressFormatCorrect()) {
      throw new Error('Email address is invalid.');
    }
  }

  public toString(): string {
    return this._emailAddress;
  }

  private _isEmailAddressTooLong() {
    return this._emailAddress.length > EmailAddress._maxLength;
  }

  private _isEmailAddressFormatCorrect() {
    return EmailAddress._emailAddressFormatRegex.test(this._emailAddress);
  }
}

/**
 * @returns Regex for verifying an email address's format.
 */
function getEmailAddressFormatRegex(): RegExp {
  const domainEdgeChars: string = '[a-zA-Z0-9]';
  const domainChars: string = '[a-zA-Z0-9\\-]';
  const domainLabelRegexStr: string = `${domainEdgeChars}(${domainChars}*${domainEdgeChars}+)*`;
  const domainRegexStr: string = `${domainLabelRegexStr}(\\.${domainLabelRegexStr})+`;

  const emailAddressUsernameChars: string = "[a-zA-Z0-9!#$%&'*+\\-/=?^_`{|}~]";

  return RegExp(
    `^${emailAddressUsernameChars}+(\\.${emailAddressUsernameChars}+)*@${domainRegexStr}$`,
  );
}
