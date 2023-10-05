/**
 * @file Defines {@link ValidateUserHandler}.
 */
import express from 'express';
import qs from 'qs';

import HttpErrorInfo from '../data_structs/http_error_info';
import UserIdentity from '../data_structs/user_identity';
import DatabaseClient from '../service/database_client';
import { parseSessionToken } from '../utils/data_parser';
import Handler, { HttpMethod } from './handler';

/**
 * Handles getting the identity of the user who owns a specified session token.
 */
export default class GetUserIdentityHandler extends Handler {
  public override get method(): HttpMethod {
    return HttpMethod.get;
  }

  public override get path(): string {
    return '/user-service/user/identity';
  }

  private static _getSessionToken(
    query: qs.ParsedQs,
    cookies: {
      [x: string]: string | undefined;
    },
  ) {
    try {
      return parseSessionToken(query['session-token']);
    } catch (e) {
      // Look for session token in cookies instead
    }

    try {
      return parseSessionToken(cookies['session-token']);
    } catch (e) {
      throw new HttpErrorInfo(401);
    }
  }

  private static async _fetchUserIdentity(
    client: DatabaseClient,
    token: string,
  ): Promise<UserIdentity> {
    const userIdentity: UserIdentity | undefined =
      await client.fetchUserIdentityFromToken(token);
    if (userIdentity === undefined) {
      throw new HttpErrorInfo(401);
    }

    return userIdentity;
  }

  /**
   * Gets the ID and role of the user who owns the session token specified in
   * the request query or in the request cookie. Sends a HTTP 200 response whose
   * body is a JSON string containing the user's identity.
   * @param req - Information about the request.
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
    const token: string = GetUserIdentityHandler._getSessionToken(
      req.query,
      req.cookies,
    );

    const userIdentity: UserIdentity =
      await GetUserIdentityHandler._fetchUserIdentity(client, token);

    res.status(200).send(JSON.stringify(userIdentity));
  }
}
