/**
 * @file Defines {@link LogoutHandler}.
 */
import express from 'express';

import HttpErrorInfo from '../data_structs/http_error_info';
import SessionToken from '../data_structs/session_token';
import DatabaseClient from '../service/database_client';
import Handler, { HttpMethod } from './handler';

/** Handles user logout. */
export default class LogoutHandler extends Handler {
  public override get method(): HttpMethod {
    return HttpMethod.delete;
  }

  public override get path(): string {
    return '/user-service/session';
  }

  private static _parseCookie(cookies: {
    [x: string]: string | undefined;
  }): SessionToken {
    try {
      return SessionToken.parse(cookies['session-token']);
    } catch (e) {
      throw new HttpErrorInfo(401);
    }
  }

  private static async _deleteUserSession(
    client: DatabaseClient,
    sessionToken: SessionToken,
  ): Promise<void> {
    if (!(await client.deleteUserSession(sessionToken))) {
      throw new HttpErrorInfo(401);
    }
  }

  /**
   * Deletes the user session which has the session token stored in the request
   * cookie. Sends a HTTP 200 response.
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
    const sessionToken: SessionToken = LogoutHandler._parseCookie(req.cookies);
    await LogoutHandler._deleteUserSession(client, sessionToken);

    res.sendStatus(200);
  }
}
