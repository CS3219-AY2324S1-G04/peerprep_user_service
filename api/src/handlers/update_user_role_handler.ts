/**
 * @file Defines {@link UpdateUserRoleHandler}.
 */
import express from 'express';
import pg from 'pg';

import UserIdentity from '../data_structs/user_identity';
import UserRole from '../enums/user_role';
import HttpInfoError from '../errors/http_info_error';
import {
  parseSessionToken,
  parseUserRole,
  parseUsername,
} from '../utils/data_parser';
import {
  fetchUserIdentityFromToken,
  updateUserRole,
} from '../utils/database_util';
import Handler, { HttpMethod } from './handler';

/**
 * Handles updating the role of the user whose username is specified in the
 * request. The user who sent the request must have the {@link UserRole.admin}
 * role.
 */
export default class UpdateUserRoleHandler implements Handler {
  public get method(): HttpMethod {
    return HttpMethod.post;
  }

  public get path(): string {
    return '/user_service/user/role';
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

  private static _parseQuery(query: qs.ParsedQs): [string, UserRole] {
    try {
      const username: string = parseUsername(query['username']);
      const userRole: UserRole = parseUserRole(query['role']);

      return [username, userRole];
    } catch (e) {
      throw new HttpInfoError(400, (e as Error).message);
    }
  }

  private static async _validatePermission(
    client: pg.ClientBase,
    token: string,
  ): Promise<void> {
    const userIdentity: UserIdentity | undefined =
      await fetchUserIdentityFromToken(client, token);

    if (userIdentity?.role !== UserRole.admin) {
      throw new HttpInfoError(401);
    }
  }

  private static async _updateUserRole(
    client: pg.ClientBase,
    username: string,
    userRole: UserRole,
  ): Promise<void> {
    if (!(await updateUserRole(client, username, userRole))) {
      throw new HttpInfoError(404, 'Username is not in use.');
    }
  }

  /**
   * Updates the role of the user on the database whose username is specified in
   * the request. The token stored in the request cookie must belong to a user
   * who has the user role {@link UserRole.admin}. Sends a HTTP 200 response.
   *
   * If no token is found, the token is invalid, or the user who owns the token
   * does not have the user role {@link UserRole.admin}, sends a HTTP 401
   * response. A token can be invalid if it is expired or is not owned by any
   * user.
   *
   * If the username specified in the request does not belong to any user, sends
   * a HTTP 404 response.
   *
   * If the username or role specified in the request is invalid, sends a HTTP
   * 400 response containing the reason for the error in the response message.
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
      const token: string = UpdateUserRoleHandler._parseCookie(req.cookies);
      const [username, userRole]: [string, UserRole] =
        UpdateUserRoleHandler._parseQuery(req.query);

      await UpdateUserRoleHandler._validatePermission(client, token);

      await UpdateUserRoleHandler._updateUserRole(client, username, userRole);

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
