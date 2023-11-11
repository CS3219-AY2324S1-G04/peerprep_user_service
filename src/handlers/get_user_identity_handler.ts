/**
 * @file Defines {@link ValidateUserHandler}.
 */
import express from 'express';

import HttpErrorInfo from '../data_structs/http_error_info';
import SessionToken from '../data_structs/session_token';
import UserIdentity, {
  createJsonCompatibleUserIdentity,
} from '../data_structs/user_identity';
import DatabaseClient from '../service/database_client';
import { sessionTokenKey } from '../utils/parameter_keys';
import Handler, { HttpMethod, authenticationErrorMessages } from './handler';

/**
 * Handles REST API requests for getting the user identity of the user who owns
 * the specified session token.
 */
export default class GetUserIdentityHandler extends Handler {
  /** @inheritdoc */
  public override get method(): HttpMethod {
    return HttpMethod.get;
  }

  /** @inheritdoc */
  public override get subPath(): string {
    return 'user/identity';
  }

  private static _getSessionToken(query: qs.ParsedQs) {
    try {
      return SessionToken.parse(query[sessionTokenKey]);
    } catch (e) {
      throw new HttpErrorInfo(401, authenticationErrorMessages.invalidSession);
    }
  }

  private static async _fetchUserIdentity(
    client: DatabaseClient,
    sessionToken: SessionToken,
  ): Promise<UserIdentity> {
    const userIdentity: UserIdentity | undefined =
      await client.fetchUserIdentityFromSessionToken(sessionToken);
    if (userIdentity === undefined) {
      throw new HttpErrorInfo(401, authenticationErrorMessages.invalidSession);
    }

    return userIdentity;
  }

  /**
   * Gets the identity of the user who owns the session token specified in the
   * request. Sends a HTTP 200 response whose body is a JSON string containing
   * the user's identity.
   * @param req - Information about the request.
   * @param res - For creating and sending the response.
   * @param next - Called to let the next handler (if any) handle the request.
   * @param client - Client for communicating with the database.
   * @throws {HttpErrorInfo} Error 401 if no session token is specified or the
   * session token is invalid.
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
    );

    const userIdentity: UserIdentity =
      await GetUserIdentityHandler._fetchUserIdentity(client, sessionToken);

    res.status(200).send(createJsonCompatibleUserIdentity(userIdentity));
  }
}
