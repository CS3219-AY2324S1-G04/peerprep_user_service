/**
 * @file Defines {@link GetUserProfileHandler}.
 */
import express from 'express';

import UserProfile from '../data_structs/user_profile';
import HttpInfoError from '../errors/http_info_error';
import DatabaseClient from '../service/database_client';
import { parseSessionToken } from '../utils/data_parser';
import Handler, { HttpMethod } from './handler';

/** Handles getting the profile of the user who sent the request. */
export default class GetUserProfileHandler implements Handler {
  public get method(): HttpMethod {
    return HttpMethod.get;
  }

  public get path(): string {
    return '/user-service/user/profile';
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

  private static async _fetchUserProfile(
    client: DatabaseClient,
    token: string,
  ): Promise<UserProfile> {
    const userProfile: UserProfile | undefined =
      await client.fetchUserProfileFromToken(token);
    if (userProfile === undefined) {
      throw new HttpInfoError(401);
    }

    return userProfile;
  }

  /**
   * Gets the profile of the user who owns the session token stored in the
   * request cookie. Sends a HTTP 200 response.
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
    client: DatabaseClient,
  ): Promise<void> {
    try {
      const token: string = GetUserProfileHandler._parseCookie(req.cookies);
      const userProfile: UserProfile =
        await GetUserProfileHandler._fetchUserProfile(client, token);

      res.status(200).send(JSON.stringify(userProfile));
    } catch (e) {
      if (e instanceof HttpInfoError) {
        res.status(e.statusCode).send(e.message);
      } else {
        res.sendStatus(500);
      }
    }
  }
}
