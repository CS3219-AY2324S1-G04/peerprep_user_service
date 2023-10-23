/**
 * @file Defines {@link KeepSessionAliveHandler}.
 */
import express from 'express';

import HttpErrorInfo from '../data_structs/http_error_info';
import SessionToken from '../data_structs/session_token';
import DatabaseClient from '../service/database_client';
import { sessionTokenKey } from '../utils/parameter_keys';
import Handler, { HttpMethod, authenticationErrorMessages } from './handler';

/**
 * Handles extending the expiry of the session whose token was included in the
 * request.
 */
export default class KeepSessionAliveHandler extends Handler {
  private readonly _sessionExpireMillis: number;

  public constructor(sessionExpireMillis: number) {
    super();
    this._sessionExpireMillis = sessionExpireMillis;
  }

  public override get method(): HttpMethod {
    return HttpMethod.post;
  }

  public override get path(): string {
    return '/user-service/session/keep-alive';
  }

  private static _parseCookie(cookies: {
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
  ) {
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
   * Extends the expiry of the session token stored in the request cookie. Sends
   * a HTTP 200 response.
   * @param req - Information about the request.
   * @param res - For creating and sending the response.
   * @param next - Called to let the next handler (if any) handle the request.
   * @param client - Client for communicating with the database.
   * @throws {HttpErrorInfo} Error 401 if no session token is found or the
   * session token is invalid (expired or not owned by any user).
   * @throws {HttpErrorInfo} Error 500 if an unexpected error occurs.
   */
  public override async handleLogic(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
    client: DatabaseClient,
  ): Promise<void> {
    const sessionToken: SessionToken = KeepSessionAliveHandler._parseCookie(
      req.cookies,
    );

    await KeepSessionAliveHandler._extendSessionExpiry(
      client,
      sessionToken,
      this._sessionExpireMillis,
    );

    res.sendStatus(200);
  }
}
