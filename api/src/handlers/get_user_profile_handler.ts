/**
 * @file Defines {@link GetUserProfileHandler}.
 */
import express from 'express';

import HttpErrorInfo from '../data_structs/http_error_info';
import SessionToken from '../data_structs/session_token';
import UserProfile, {
  jsonStringifyUserProfile,
} from '../data_structs/user_profile';
import DatabaseClient from '../service/database_client';
import Handler, { HttpMethod } from './handler';
import { sessionTokenKey } from '../utils/parameter_keys';

/** Handles getting the profile of the user who sent the request. */
export default class GetUserProfileHandler extends Handler {
  public override get method(): HttpMethod {
    return HttpMethod.get;
  }

  public override get path(): string {
    return '/user-service/user/profile';
  }

  private static _parseCookie(cookies: {
    [x: string]: string | undefined;
  }): SessionToken {
    try {
      return SessionToken.parse(cookies[sessionTokenKey]);
    } catch (e) {
      throw new HttpErrorInfo(401);
    }
  }

  private static async _fetchUserProfile(
    client: DatabaseClient,
    sessionToken: SessionToken,
  ): Promise<UserProfile> {
    const userProfile: UserProfile | undefined =
      await client.fetchUserProfileFromSessionToken(sessionToken);
    if (userProfile === undefined) {
      throw new HttpErrorInfo(401);
    }

    return userProfile;
  }

  /**
   * Gets the profile of the user who owns the session token stored in the
   * request cookie. Sends a HTTP 200 response whose body is the JSON string
   * containing the user's profile.
   * @param req - Information about the request.
   * @param res - For creating and sending the response.
   * @param next - Called to let the next handler (if any) handle the request.
   * @param client - Client for communicating with the database.
   * @throws {HttpErrorInfo} Error 401 if no session token is found or the
   * session token is invalid (expired or not owned by any user).
   * @throws {HttpErrorInfo} Error 500 if an unexpected error occurs.
   */
  public override async handleLogic(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
    client: DatabaseClient,
  ): Promise<void> {
    const sessionToken: SessionToken = GetUserProfileHandler._parseCookie(
      req.cookies,
    );
    const userProfile: UserProfile =
      await GetUserProfileHandler._fetchUserProfile(client, sessionToken);

    res.status(200).send(jsonStringifyUserProfile(userProfile));
  }
}
