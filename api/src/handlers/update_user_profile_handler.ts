/**
 * @file Defines {@link UpdateUserProfileHandler}.
 */
import express from 'express';

import HttpErrorInfo from '../data_structs/http_error_info';
import InvalidParamInfo from '../data_structs/invalid_param_info';
import ClientModifiableUserProfile from '../data_structs/uncreated_user_profile';
import DatabaseClient from '../service/database_client';
import {
  parseEmail,
  parseSessionToken,
  parseUsername,
} from '../utils/data_parser';
import Handler, { HttpMethod } from './handler';

/** Handles updating the profile of the user who sent the request. */
export default class UpdateUserProfileHandler extends Handler {
  public override get method(): HttpMethod {
    return HttpMethod.put;
  }

  public override get path(): string {
    return '/user-service/user/profile';
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

  private static _parseQuery(query: qs.ParsedQs): ClientModifiableUserProfile {
    let username: string;
    let email: string;

    const invalidInfo: Array<InvalidParamInfo> = [];

    try {
      username = parseUsername(query['username']);
    } catch (e) {
      invalidInfo.push({ param: 'username', message: (e as Error).message });
    }

    try {
      email = parseEmail(query['email']);
    } catch (e) {
      invalidInfo.push({ param: 'email', message: (e as Error).message });
    }

    if (invalidInfo.length > 0) {
      throw new HttpErrorInfo(400, JSON.stringify(invalidInfo));
    }

    return { username: username!, email: email! };
  }

  private static async _updateUserProfile(
    client: DatabaseClient,
    userProfile: ClientModifiableUserProfile,
    token: string,
  ): Promise<void> {
    try {
      if (!(await client.updateUserProfile(userProfile, token))) {
        throw new HttpErrorInfo(401);
      }
    } catch (e) {
      if (client.isDuplicateUserProfileUsernameError(e)) {
        throw new HttpErrorInfo(
          400,
          JSON.stringify([
            {
              param: 'username',
              message: 'Username already in use.',
            },
          ]),
        );
      } else if (client.isDuplicateUserProfileEmailError(e)) {
        throw new HttpErrorInfo(
          400,
          JSON.stringify([
            {
              param: 'email',
              message: 'Email already in use.',
            },
          ]),
        );
      }

      throw e;
    }
  }

  /**
   * Updates the user profile belonging to the user who owns the session token
   * stored in the request cookie. Sends a HTTP 200 response.
   * @param req - Information about the request.
   * @param res - For creating and sending the response.
   * @param next - Called to let the next handler (if any) handle the request.
   * @param client - Client for communicating with the database.
   * @throws {HttpErrorInfo} Error 401 if no session token is found or the
   * session token is invalid. A session token can be invalid if it is expired
   * or is not owned by any user.
   * @throws {HttpErrorInfo} Error 400 if the updated user profile values are
   * invalid. Message contains a JSON string of the reasons for the error.
   * @throws {HttpErrorInfo} Error 500 if an unexpected error occurs.
   */
  public override async handleLogic(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
    client: DatabaseClient,
  ): Promise<void> {
    const token: string = UpdateUserProfileHandler._parseCookie(req.cookies);
    const userProfile: ClientModifiableUserProfile =
      UpdateUserProfileHandler._parseQuery(req.query);

    await UpdateUserProfileHandler._updateUserProfile(
      client,
      userProfile,
      token,
    );

    res.sendStatus(200);
  }
}
