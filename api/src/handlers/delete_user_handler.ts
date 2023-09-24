/**
 * @file Defines {@link DeleteUserHandler}.
 */
import express from 'express';
import pg from 'pg';

import HttpInfoError from '../errors/http_info_error';
import { parseSessionToken } from '../utils/data_parser';
import { deleteUserProfile } from '../utils/database_util';
import Handler, { HttpMethod } from './handler';

/** Handles deleting the user who sent the request. */
export default class DeleteUserHandler implements Handler {
  public get method(): HttpMethod {
    return HttpMethod.delete;
  }

  public get path(): string {
    return '/user_service/user';
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

  private static async _deleteUserProfile(
    client: pg.ClientBase,
    token: string,
  ) {
    if (!(await deleteUserProfile(client, token))) {
      throw new HttpInfoError(401);
    }
  }

  /**
   * Deletes the user who owns the session token stored in the request cookie.
   * Sends a HTTP 200 response.
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
    client: pg.ClientBase,
  ): Promise<void> {
    try {
      const token: string = DeleteUserHandler._parseCookie(req.cookies);
      await DeleteUserHandler._deleteUserProfile(client, token);

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
