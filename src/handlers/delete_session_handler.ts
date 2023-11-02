/**
 * @file Defines {@link DeleteSessionHandler}.
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

/** Handles deleting sessions. */
export default class DeleteSessionHandler extends Handler {
  public override get method(): HttpMethod {
    return HttpMethod.delete;
  }

  public override get subPath(): string {
    return 'session';
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

  private static async _deleteUserSession(
    client: DatabaseClient,
    sessionToken: SessionToken,
  ): Promise<void> {
    if (!(await client.deleteUserSession(sessionToken))) {
      throw new HttpErrorInfo(401, authenticationErrorMessages.invalidSession);
    }
  }

  /**
   * Deletes the user session associated with the session token specified in the
   * request cookie. Sends a HTTP 200 response with expired session token,
   * access token, and access token expiry cookies.
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
    const sessionToken: SessionToken = DeleteSessionHandler._parseCookies(
      req.cookies,
    );
    await DeleteSessionHandler._deleteUserSession(client, sessionToken);

    HandlerUtils.addExpiredCookies(res);

    res.sendStatus(200);
  }
}
