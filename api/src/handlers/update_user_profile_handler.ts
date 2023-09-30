/**
 * @file Defines {@link UpdateUserProfileHandler}.
 */
import express from 'express';

import UserProfile from '../data_structs/user_profile';
import HttpInfoError from '../errors/http_info_error';
import DatabaseClient from '../service/database_client';
import {
  parseEmail,
  parseSessionToken,
  parseUsername,
} from '../utils/data_parser';
import Handler, { HttpMethod } from './handler';

/** Handles updating the profile of the user who sent the request. */
export default class UpdateUserProfileHandler implements Handler {
  public get method(): HttpMethod {
    return HttpMethod.post;
  }

  public get path(): string {
    return '/user_service/user/profile';
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

  private static _parseQuery(query: qs.ParsedQs): UserProfile {
    try {
      const username = parseUsername(query['username']);
      const email = parseEmail(query['email']);

      return new UserProfile(undefined, username, email, undefined);
    } catch (e) {
      throw new HttpInfoError(400, (e as Error).message);
    }
  }

  private static async _updateUserProfile(
    client: DatabaseClient,
    userProfile: UserProfile,
    token: string,
  ): Promise<void> {
    try {
      if (!(await client.updateUserProfile(userProfile, token))) {
        throw new HttpInfoError(401);
      }
    } catch (e) {
      if (client.isDuplicateUserProfileUsernameError(e)) {
        throw new HttpInfoError(400, 'Username already in use.');
      } else if (client.isDuplicateUserProfileEmailError(e)) {
        throw new HttpInfoError(400, 'Email already in use.');
      }

      throw e;
    }
  }

  /**
   * Updates the user profile belonging to the user who owns the session token
   * stored in the request cookie. Sends a HTTP 200 response.
   *
   * If no session token is found or the session token is invalid, sends a HTTP
   * 401 response. A session token can be invalid if it is expired or is not
   * owned by any user.
   *
   * If the updated user profile values are invalid, sends a HTTP 400 response
   * containing the reason for the error in the response message.
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
      const token: string = UpdateUserProfileHandler._parseCookie(req.cookies);
      const userProfile: UserProfile = UpdateUserProfileHandler._parseQuery(
        req.query,
      );

      await UpdateUserProfileHandler._updateUserProfile(
        client,
        userProfile,
        token,
      );

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
