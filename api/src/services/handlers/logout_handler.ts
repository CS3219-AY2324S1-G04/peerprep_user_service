/**
 * @file Defines {@link LogoutHandler}.
 */
import express from 'express';
import pg from 'pg';

import HttpInfoError from '../../errors/http_info_error';
import { deleteUserSessionEntry } from '../../utils/database_util';
import Handler, { HttpMethod } from './handler';

/** Handles user logout. */
export default class LogoutHandler implements Handler {
  public get method(): HttpMethod {
    return HttpMethod.post;
  }

  public get path(): string {
    return '/logout';
  }

  private static _parseCookie(cookies: {
    [x: string]: string | undefined;
  }): string {
    const token: string | undefined = cookies['session_token'];
    if (token === undefined) {
      throw new HttpInfoError(401);
    }

    return token;
  }

  private static async _deleteUserSessionEntry(
    client: pg.ClientBase,
    token: string,
  ): Promise<void> {
    if (!(await deleteUserSessionEntry(client, token))) {
      throw new HttpInfoError(401);
    }
  }

  /**
   * Deletes from the database, the session which has the token stored in the
   * request cookie. Sends a HTTP 200 response.
   *
   * If no token is found or the token is invalid, sends a HTTP 401 response. A
   * token can be invalid if it is expired or is not owned by any user.
   *
   * If an internal server error occurs, sends a HTTP 500 response.
   * @param req - Information about the request.
   * @param res - For creating and sending the response.
   * @param next - Called to let the next handler (if any) handle the request.
   * @param client - Client for communicating with the database.
   */
  public async handle(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
    client: pg.ClientBase,
  ): Promise<void> {
    try {
      const token: string = LogoutHandler._parseCookie(req.cookies);
      await LogoutHandler._deleteUserSessionEntry(client, token);

      res.sendStatus(200);
    } catch (e) {
      if (e instanceof HttpInfoError) {
        res.status(e.statusCode).send(e.message);
      } else {
        res.sendStatus(500);
      }
    }
  }
}
