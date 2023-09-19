/**
 * @file Defines {@link GetUserProfileHandler}.
 */
import express from 'express';
import pg from 'pg';

import UserProfile from '../../data/user_profile';
import HttpInfoError from '../../errors/http_info_error';
import { fetchUserProfileFromToken } from '../../utils/database_util';
import Handler, { HttpMethod } from './handler';

/** Handles getting the profile of the user who sent the request. */
export default class GetUserProfileHandler implements Handler {
  public get method(): HttpMethod {
    return HttpMethod.get;
  }

  public get path(): string {
    return '/user';
  }

  private static _parseCookie(cookies: {
    [x: string]: string | undefined;
  }): string {
    const token: string | undefined = cookies['session_token'];
    if (token === undefined) {
      throw new HttpInfoError(401);
    }

    return token;
  }

  private static async _fetchUserProfileFromToken(
    client: pg.ClientBase,
    token: string,
  ): Promise<UserProfile> {
    const userProfile: UserProfile | undefined =
      await fetchUserProfileFromToken(client, token);
    if (userProfile === undefined) {
      throw new HttpInfoError(401);
    }

    return userProfile;
  }

  /**
   * Gets from the database, the profile of the user who owns the token stored
   * in the request cookie. Sends a HTTP 200 response.
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
      const token: string = GetUserProfileHandler._parseCookie(req.cookies);
      const userProfile: UserProfile =
        await GetUserProfileHandler._fetchUserProfileFromToken(client, token);

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