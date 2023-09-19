/**
 * @file Defines {@link UpdateUserProfileHandler}.
 */
import express from 'express';
import pg from 'pg';

import UserProfile from '../../data/user_profile';
import HttpInfoError from '../../errors/http_info_error';
import { parseEmail, parseUsername } from '../../utils/data_parser';
import {
  isDuplicateUserProfileEmailError,
  isDuplicateUserProfileUsernameError,
  updateUserProfileEntry,
} from '../../utils/database_util';
import Handler, { HttpMethod } from './handler';

/** Handles updating the profile of the user who sent the request. */
export default class UpdateUserProfileHandler implements Handler {
  public get method(): HttpMethod {
    return HttpMethod.post;
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

  private static _parseQuery(query: qs.ParsedQs): UserProfile {
    try {
      const username = parseUsername(query['username']);
      const email = parseEmail(query['email']);

      return new UserProfile(undefined, username, email, undefined);
    } catch (e) {
      throw new HttpInfoError(400, (e as Error).message);
    }
  }

  private static async _updateUserProfileEntry(
    client: pg.ClientBase,
    userProfile: UserProfile,
    token: string,
  ): Promise<void> {
    try {
      if (!(await updateUserProfileEntry(client, userProfile, token))) {
        throw new HttpInfoError(401);
      }
    } catch (e) {
      if (isDuplicateUserProfileUsernameError(e)) {
        throw new HttpInfoError(400, 'Username already in use.');
      } else if (isDuplicateUserProfileEmailError(e)) {
        throw new HttpInfoError(400, 'Email already in use.');
      }

      throw e;
    }
  }

  /**
   * Updates the user profile on the database belonging to the user who owns the
   * token stored in the request cookie. Sends a HTTP 200 response.
   *
   * If no token is found or the token is invalid, sends a HTTP 401 response. A
   * token can be invalid if it is expired or is not owned by any user.
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
    client: pg.ClientBase,
  ): Promise<void> {
    try {
      const token: string = UpdateUserProfileHandler._parseCookie(req.cookies);
      const userProfile: UserProfile = UpdateUserProfileHandler._parseQuery(
        req.query,
      );

      await UpdateUserProfileHandler._updateUserProfileEntry(
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
