/**
 * @file Defines {@link DeleteUserHandler}.
 */
import express from 'express';

import HttpErrorInfo from '../data_structs/http_error_info';
import SessionToken from '../data_structs/session_token';
import DatabaseClient from '../service/database_client';
import Handler, { HttpMethod } from './handler';
import { sessionTokenKey } from '../utils/parameter_keys';

/** Handles deleting the user who sent the request. */
export default class DeleteUserHandler extends Handler {
  public override get method(): HttpMethod {
    return HttpMethod.delete;
  }

  public override get path(): string {
    return '/user-service/user';
  }

  private static _parseCookie(cookies: {
    [x: string]: string | undefined;
  }): SessionToken {
    try {
      return SessionToken.parse(cookies[sessionTokenKey]);
    } catch (e) {
      throw new HttpErrorInfo(401);
    }
  }

  private static async _deleteUserProfile(
    client: DatabaseClient,
    sessionToken: SessionToken,
  ) {
    if (!(await client.deleteUserProfile(sessionToken))) {
      throw new HttpErrorInfo(401);
    }
  }

  /**
   * Deletes the user who owns the session token stored in the request cookie.
   * @param req - Information about the request. Sends a HTTP 200 response.
   * @param res - For creating and sending the response.
   * @param next - Called to let the next handler (if any) handle the request.
   * @param client - Client for communicating with the database.
   * @throws {HttpErrorInfo} Error 401 if no session token is found or the
   * session token is invalid (expired or not owned by any user).
   * @throws {HttpErrorInfo} Error 500 if an unexpected error occurs.
   */
  protected override async handleLogic(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
    client: DatabaseClient,
  ): Promise<void> {
    const sessionToken: SessionToken = DeleteUserHandler._parseCookie(
      req.cookies,
    );
    await DeleteUserHandler._deleteUserProfile(client, sessionToken);

    res.sendStatus(200);
  }
}
