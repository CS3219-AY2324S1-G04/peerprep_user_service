/**
 * @file Defines {@link DeleteUserHandler}.
 */
import express from 'express';

import HttpErrorInfo from '../data_structs/http_error_info';
import DatabaseClient from '../service/database_client';
import { parseSessionToken } from '../utils/data_parser';
import Handler, { HttpMethod } from './handler';

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
  }): string {
    try {
      return parseSessionToken(cookies['session-token']);
    } catch (e) {
      throw new HttpErrorInfo(401);
    }
  }

  private static async _deleteUserProfile(
    client: DatabaseClient,
    token: string,
  ) {
    if (!(await client.deleteUserProfile(token))) {
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
    const token: string = DeleteUserHandler._parseCookie(req.cookies);
    await DeleteUserHandler._deleteUserProfile(client, token);

    res.sendStatus(200);
  }
}
