/**
 * @file Defines {@link ValidateUserHandler}.
 */
import express from 'express';
import pg from 'pg';
import qs from 'qs';

import UserIdentity from '../../data/user_identity';
import HttpInfoError from '../../errors/http_info_error';
import { parseSessionToken } from '../../utils/data_parser';
import { fetchUserIdentityFromToken } from '../../utils/database_util';
import Handler, { HttpMethod } from './handler';

/**
 * Handles getting the identity of the user who owns a specified session token.
 */
export default class GetUserIdentityHandler implements Handler {
  public get method(): HttpMethod {
    return HttpMethod.get;
  }

  public get path(): string {
    return '/user_service/identity';
  }

  private static _getSessionToken(
    query: qs.ParsedQs,
    cookies: {
      [x: string]: string | undefined;
    },
  ) {
    try {
      return parseSessionToken(query['session_token']);
    } catch (e) {
      // Look for session token in cookies instead
    }

    try {
      return parseSessionToken(cookies['session_token']);
    } catch (e) {
      throw new HttpInfoError(401);
    }
  }

  private static async _fetchUserIdentity(
    client: pg.ClientBase,
    token: string,
  ): Promise<UserIdentity> {
    const userIdentity: UserIdentity | undefined =
      await fetchUserIdentityFromToken(client, token);
    if (userIdentity === undefined) {
      throw new HttpInfoError(401);
    }

    return userIdentity;
  }

  /**
   * Gets from the database, the ID and role of the user who owns the token
   * specified in the request query or in the request cookie. Sends a HTTP 200
   * response.
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
      const token: string = GetUserIdentityHandler._getSessionToken(
        req.query,
        req.cookies,
      );

      const userIdentity: UserIdentity =
        await GetUserIdentityHandler._fetchUserIdentity(client, token);

      res.status(200).send(JSON.stringify(userIdentity));
    } catch (e) {
      if (e instanceof HttpInfoError) {
        res.status(e.statusCode).send(e.message);
      } else {
        res.sendStatus(500);
      }
    }
  }
}