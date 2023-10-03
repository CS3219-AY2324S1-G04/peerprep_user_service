/**
 * @file Defines {@link LogoutHandler}.
 */
import express from 'express';

import HttpInfoError from '../errors/http_info_error';
import DatabaseClient from '../service/database_client';
import { parseSessionToken } from '../utils/data_parser';
import Handler, { HttpMethod } from './handler';

/** Handles user logout. */
export default class LogoutHandler implements Handler {
  public get method(): HttpMethod {
    return HttpMethod.delete;
  }

  public get path(): string {
    return '/user-service/session';
  }

  private static _parseCookie(cookies: {
    [x: string]: string | undefined;
  }): string {
    try {
      return parseSessionToken(cookies['session_token']);
    } catch (e) {
      throw new HttpInfoError(401);
    }
  }

  private static async _deleteUserSession(
    client: DatabaseClient,
    token: string,
  ): Promise<void> {
    if (!(await client.deleteUserSession(token))) {
      throw new HttpInfoError(401);
    }
  }

  /**
   * Deletes the user session which has the session token stored in the request
   * cookie. Sends a HTTP 200 response.
   *
   * If no session token is found or the session token is invalid, sends a HTTP
   * 401 response. A session token can be invalid if it is expired or is not
   * owned by any user.
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
    client: DatabaseClient,
  ): Promise<void> {
    try {
      const token: string = LogoutHandler._parseCookie(req.cookies);
      await LogoutHandler._deleteUserSession(client, token);

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
