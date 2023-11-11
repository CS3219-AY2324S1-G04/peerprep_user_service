/**
 * @file Defines {@link AccessToken}.
 */
import jwt, { JwtPayload } from 'jsonwebtoken';

import { parseUserRole } from '../enums/user_role';
import {
  emailAddressKey,
  userIdKey,
  userRoleKey,
  usernameKey,
} from '../utils/parameter_keys';
import EmailAddress from './email_address';
import UserId from './user_id';
import UserProfile, { createJsonCompatibleUserProfile } from './user_profile';
import Username from './username';

/** Access token. */
export default class AccessToken {
  private static _algorithm = 'RS256' as const;

  /** User profile stored as the access token payload. */
  public readonly userProfile: UserProfile;

  /** Expiry date and time of the access token. */
  public readonly expiry: Date;

  private readonly _accessToken: string;

  private constructor(
    accessToken: string,
    userProfile: UserProfile,
    expiry: Date,
  ) {
    this._accessToken = accessToken;
    this.userProfile = userProfile;
    this.expiry = expiry;
  }

  /**
   * Creates an {@link AccessToken} by generating a new access token.
   * @param userProfile - User profile to be stored in the access token payload.
   * @param privateKey - Private key for signing the access token.
   * @param expireMillis - Number of milliseconds till the access token expires.
   * @returns Created {@link AccessToken}.
   */
  public static create(
    userProfile: UserProfile,
    privateKey: string,
    expireMillis: number,
  ): AccessToken {
    const expiry: Date = new Date(Date.now() + expireMillis);

    return new AccessToken(
      jwt.sign(createJsonCompatibleUserProfile(userProfile), privateKey, {
        algorithm: AccessToken._algorithm,
        expiresIn: expireMillis.toString(),
      }),
      userProfile,
      expiry,
    );
  }

  /**
   * Creates an {@link AccessToken} by verifying and decoding a specified
   * access token.
   * @param rawAccessToken - Access token to be decoded.
   * @param publicKey - Public key for verifying the access token.
   * @returns Created {@link AccessToken}.
   * @throws {Error} if {@link rawAccessToken} is not a valid access token.
   */
  public static verify(
    rawAccessToken: string | undefined,
    publicKey: string,
  ): AccessToken {
    if (!AccessToken._isAccessTokenSpecified(rawAccessToken)) {
      throw new Error('Access token cannot be empty.');
    }

    const payload: JwtPayload = jwt.verify(
      rawAccessToken!,
      publicKey,
    ) as JwtPayload;

    if (!AccessToken._isAccessTokenExpirySpecified(payload)) {
      throw new Error('Access token expiry date and time is missing.');
    }

    return new AccessToken(
      rawAccessToken!,
      {
        userId: UserId.parseNumber(payload[userIdKey]),
        userRole: parseUserRole(payload[userRoleKey]),
        username: Username.parse(payload[usernameKey]),
        emailAddress: EmailAddress.parse(payload[emailAddressKey]),
      },
      new Date(payload.exp! * 1000),
    );
  }

  private static _isAccessTokenSpecified(
    rawAccessToken: string | undefined,
  ): boolean {
    return rawAccessToken !== undefined && rawAccessToken.length > 0;
  }

  private static _isAccessTokenExpirySpecified(
    accessTokenPayload: JwtPayload,
  ): boolean {
    return typeof accessTokenPayload.exp === 'number';
  }

  /** @returns String representation. */
  public toString(): string {
    return this._accessToken;
  }
}
