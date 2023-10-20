/**
 * @file Defines {@link ValidateUserHandler}.
 */
import express from 'express';
import qs from 'qs';

import HttpErrorInfo from '../data_structs/http_error_info';
import SessionToken from '../data_structs/session_token';
import UserIdentity, {
  jsonStringifyUserIdentity,
} from '../data_structs/user_identity';
import DatabaseClient from '../service/database_client';
import { sessionTokenKey } from '../utils/parameter_keys';
import Handler, { HttpMethod } from './handler';

/**
 * Handles getting the user identity of the user who owns a specified session
 * token.
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
      return SessionToken.parse(query[sessionTokenKey]);
    } catch (e) {
      // Look for session token in cookies instead
    }

    try {
      return SessionToken.parse(cookies[sessionTokenKey]);
    } catch (e) {
      throw new HttpErrorInfo(401);
    }
  }

  private static async _fetchUserIdentity(
    client: DatabaseClient,
    sessionToken: SessionToken,
  ): Promise<UserIdentity> {
    const userIdentity: UserIdentity | undefined =
      await client.fetchUserIdentityFromSessionToken(sessionToken);
    if (userIdentity === undefined) {
      throw new HttpErrorInfo(401);
    }

    return userIdentity;
  }

  /**
   * Gets the user ID and user role of the user who owns the session token
   * specified in the request query or in the request cookie. Sends a HTTP 200
   * response whose body is a JSON string containing the user's identity.
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
    const sessionToken: SessionToken = GetUserIdentityHandler._getSessionToken(
      req.query,
      req.cookies,
    );

    const userIdentity: UserIdentity =
      await GetUserIdentityHandler._fetchUserIdentity(client, sessionToken);

    res.status(200).send(jsonStringifyUserIdentity(userIdentity));
  }
}
