/**
 * @file Defines {@link GetAccessTokenHandler}.
 */
import express from 'express';

import HttpErrorInfo from '../data_structs/http_error_info';
import SessionToken from '../data_structs/session_token';
import DatabaseClient from '../service/database_client';
import { sessionTokenKey } from '../utils/parameter_keys';
import Handler, {
  HandlerUtils,
  HttpMethod,
  authenticationErrorMessages,
} from './handler';

/**
 * Handles getting an access token for the user who sent the request.
 *
 * Also extends the expiry of the session which the request is associated with.
 */
export default class GetAccessTokenHandler extends Handler {
  private readonly _accessTokenPrivateKey: string;
  private readonly _sessionExpireMillis: number;
  private readonly _accessTokenExpireMillis: number;

  /**
   * @param accessTokenPrivateKey - Private key for creating access tokens.
   * @param sessionExpireMillis - Number of milliseconds a session can last for.
   * @param accessTokenExpireMillis - Number of milliseconds an access token
   * remains valid for.
   */
  public constructor(
    accessTokenPrivateKey: string,
    sessionExpireMillis: number,
    accessTokenExpireMillis: number,
  ) {
    super();
    this._accessTokenPrivateKey = accessTokenPrivateKey;
    this._sessionExpireMillis = sessionExpireMillis;
    this._accessTokenExpireMillis = accessTokenExpireMillis;
  }

  /** @inheritdoc */
  public override get method(): HttpMethod {
    return HttpMethod.get;
  }

  /** @inheritdoc */
  public override get subPath(): string {
    return 'session/access-token';
  }

  private static _parseCookies(cookies: {
    [x: string]: string | undefined;
  }): SessionToken {
    try {
      return SessionToken.parse(cookies[sessionTokenKey]);
    } catch (e) {
      throw new HttpErrorInfo(401, authenticationErrorMessages.invalidSession);
    }
  }

  private static async _extendSessionExpiry(
    client: DatabaseClient,
    sessionToken: SessionToken,
    sessionExpireMillis: number,
  ): Promise<void> {
    if (
      !(await client.updateUserSessionExpiry(
        sessionToken,
        new Date(Date.now() + sessionExpireMillis),
      ))
    ) {
      throw new HttpErrorInfo(401, authenticationErrorMessages.invalidSession);
    }
  }

  /**
   * Gets an access token for the user who owns the session token stored in the
   * request cookie. Also extends the expiry of the session which the session
   * token is associated with. Sends a HTTP 200 response containing the session
   * token, access token, and access token expiry as cookies.
   * @param req - Information about the request.
   * @param res - For creating and sending the response.
   * @param next - Called to let the next handler (if any) handle the request.
   * @param client - Client for communicating with the database.
   * @throws {HttpErrorInfo} Error 401 if no session token is specified or the
   * session token is invalid.
   * @throws {HttpErrorInfo} Error 500 if an unexpected error occurs.
   */
  public override async handleLogic(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
    client: DatabaseClient,
  ): Promise<void> {
    const sessionToken: SessionToken = GetAccessTokenHandler._parseCookies(
      req.cookies,
    );

    await GetAccessTokenHandler._extendSessionExpiry(
      client,
      sessionToken,
      this._sessionExpireMillis,
    );

    await HandlerUtils.addSessionTokenCookie(res, sessionToken);
    await HandlerUtils.addAccessTokenCookie(
      res,
      client,
      sessionToken,
      this._accessTokenPrivateKey,
      this._accessTokenExpireMillis,
    );

    res.status(200).send();
  }
}
