/**
 * @file Defines {@link UpdateUserRoleHandler}.
 */
import express from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

import UserIdentity from '../data_structs/user_identity';
import UserRole from '../enums/user_role';
import HttpInfoError from '../errors/http_info_error';
import DatabaseClient from '../service/database_client';
import {
  parseSessionToken,
  parseUserId,
  parseUserRole,
} from '../utils/data_parser';
import Handler, { HttpMethod } from './handler';

/**
 * Handles updating the role of the user whose username is specified in the
 * request. The user who sent the request must have the {@link UserRole.admin}
 * role.
 */
export default class UpdateUserRoleHandler implements Handler {
  public get method(): HttpMethod {
    return HttpMethod.put;
  }

  public get path(): string {
    return '/user-service/users/:userId/role';
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

  private static _parseParams(params: ParamsDictionary): number {
    try {
      return parseUserId(params['userId']);
    } catch (e) {
      throw new HttpInfoError(400, (e as Error).message);
    }
  }

  private static _parseQuery(query: qs.ParsedQs): UserRole {
    try {
      const userRole: UserRole = parseUserRole(query['role']);

      return userRole;
    } catch (e) {
      throw new HttpInfoError(400, (e as Error).message);
    }
  }

  private static async _validatePermission(
    client: DatabaseClient,
    token: string,
  ): Promise<void> {
    const userIdentity: UserIdentity | undefined =
      await client.fetchUserIdentityFromToken(token);

    if (userIdentity?.userRole !== UserRole.admin) {
      throw new HttpInfoError(401);
    }
  }

  private static async _updateUserRole(
    client: DatabaseClient,
    userId: number,
    userRole: UserRole,
  ): Promise<void> {
    if (!(await client.updateUserRole(userId, userRole))) {
      throw new HttpInfoError(404, 'User does not exist.');
    }
  }

  /**
   * Updates the role of the user whose username is specified in the request.
   * The session token stored in the request cookie must belong to a user who
   * has the user role {@link UserRole.admin}. Sends a HTTP 200 response.
   *
   * If the username or user role specified in the request is invalid, sends a
   * HTTP 400 response containing the reason for the error in the response
   * message.
   *
   * If no session token is found, or the session token is invalid, or the user
   * who owns the session token does not have the user role
   * {@link UserRole.admin}, sends a HTTP 401 response. A session token can be
   * invalid if it is expired or is not owned by any user.
   *
   * If the username specified in the request does not belong to any user, sends
   * a HTTP 404 response.
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
      const token: string = UpdateUserRoleHandler._parseCookie(req.cookies);
      const userId: number = UpdateUserRoleHandler._parseParams(req.params);
      const userRole: UserRole = UpdateUserRoleHandler._parseQuery(req.query);

      await UpdateUserRoleHandler._validatePermission(client, token);

      await UpdateUserRoleHandler._updateUserRole(client, userId, userRole);

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
