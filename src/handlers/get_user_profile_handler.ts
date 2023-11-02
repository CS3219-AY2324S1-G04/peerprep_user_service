/**
 * @file Defines {@link GetUserProfileHandler}.
 */
import express from 'express';

import AccessToken from '../data_structs/access_token';
import HttpErrorInfo from '../data_structs/http_error_info';
import { createJsonCompatibleUserProfile } from '../data_structs/user_profile';
import { accessTokenKey } from '../utils/parameter_keys';
import Handler, { HttpMethod, authenticationErrorMessages } from './handler';

/** Handles getting the profile of the user who sent the request. */
export default class GetUserProfileHandler extends Handler {
  private readonly _accessTokenPublicKey: string;

  public constructor(accessTokenPublicKey: string) {
    super();
    this._accessTokenPublicKey = accessTokenPublicKey;
  }

  public override get method(): HttpMethod {
    return HttpMethod.get;
  }

  public override get subPath(): string {
    return 'user/profile';
  }

  private static _parseCookie(
    cookies: {
      [x: string]: string | undefined;
    },
    accessTokenPublicKey: string,
  ): AccessToken {
    try {
      return AccessToken.verify(cookies[accessTokenKey], accessTokenPublicKey);
    } catch (e) {
      throw new HttpErrorInfo(
        401,
        authenticationErrorMessages.invalidAccessToken,
      );
    }
  }

  /**
   * Gets the profile of the user who owns the access token stored in the
   * request cookie. Sends a HTTP 200 response whose body is the JSON string
   * containing the user's profile.
   * @param req - Information about the request.
   * @param res - For creating and sending the response.
   * @throws {HttpErrorInfo} Error 401 if no access token is specified or the
   * access token is invalid.
   * @throws {HttpErrorInfo} Error 500 if an unexpected error occurs.
   */
  public override async handleLogic(
    req: express.Request,
    res: express.Response,
  ): Promise<void> {
    const accessToken: AccessToken = GetUserProfileHandler._parseCookie(
      req.cookies,
      this._accessTokenPublicKey,
    );

    res
      .status(200)
      .send(createJsonCompatibleUserProfile(accessToken.userProfile));
  }
}
