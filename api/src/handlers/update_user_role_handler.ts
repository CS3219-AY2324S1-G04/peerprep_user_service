/**
 * @file Defines {@link UpdateUserRoleHandler}.
 */
import express from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

import HttpErrorInfo from '../data_structs/http_error_info';
import InvalidParamInfo from '../data_structs/invalid_param_info';
import UserIdentity from '../data_structs/user_identity';
import UserRole from '../enums/user_role';
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
export default class UpdateUserRoleHandler extends Handler {
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
      return parseSessionToken(cookies['session-token']);
    } catch (e) {
      throw new HttpErrorInfo(401);
    }
  }

  private static _parseParams(
    pathParams: ParamsDictionary,
    queryParams: qs.ParsedQs,
  ): [number, UserRole] {
    let userId: number;
    let userRole: UserRole;

    const invalidInfo: Array<InvalidParamInfo> = [];

    try {
      userId = parseUserId(pathParams['userId']);
    } catch (e) {
      invalidInfo.push({ param: 'userId', message: (e as Error).message });
    }

    try {
      userRole = parseUserRole(queryParams['role']);
    } catch (e) {
      invalidInfo.push({ param: 'role', message: (e as Error).message });
    }

    if (invalidInfo.length > 0) {
      throw new HttpErrorInfo(400, JSON.stringify(invalidInfo));
    }

    return [userId!, userRole!];
  }

  private static async _validatePermission(
    client: DatabaseClient,
    token: string,
  ): Promise<void> {
    const userIdentity: UserIdentity | undefined =
      await client.fetchUserIdentityFromToken(token);

    if (userIdentity?.userRole !== UserRole.admin) {
      throw new HttpErrorInfo(401);
    }
  }

  private static async _updateUserRole(
    client: DatabaseClient,
    userId: number,
    userRole: UserRole,
  ): Promise<void> {
    if (!(await client.updateUserRole(userId, userRole))) {
      throw new HttpErrorInfo(404, 'User does not exist.');
    }
  }

  /**
   * Updates the role of the user whose user ID is specified in the request.
   * The session token stored in the request cookie must belong to a user who
   * has the user role {@link UserRole.admin}. Sends a HTTP 200 response.
   * @param req - Information about the request.
   * @param res - For creating and sending the response.
   * @param next - Called to let the next handler (if any) handle the request.
   * @param client - Client for communicating with the database.
   * @throws {HttpErrorInfo} Error 400 if the username and/or user role
   * specified in the request is invalid. Message contains a JSON string of the
   * reasons for the error.
   * @throws {HttpErrorInfo} Error 401 if no session token is found, or the
   * session token is invalid, or the user who owns the session token does not
   * have the user role {@link UserRole.admin}. A session token can be
   * invalid if it is expired or is not owned by any user.
   * @throws {HttpErrorInfo} Error 404 if the user ID in the request does not
   * belong to any user.
   * @throws {HttpErrorInfo} Error 500 if an unexpected error occurs.
   */
  public override async handleLogic(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
    client: DatabaseClient,
  ): Promise<void> {
    const token: string = UpdateUserRoleHandler._parseCookie(req.cookies);
    const [userId, userRole]: [number, UserRole] =
      UpdateUserRoleHandler._parseParams(req.params, req.query);

    await UpdateUserRoleHandler._validatePermission(client, token);

    await UpdateUserRoleHandler._updateUserRole(client, userId, userRole);

    res.sendStatus(200);
  }
}
