/**
 * @file Defines {@link Handler}.
 */
import express, { CookieOptions } from 'express';

import AccessToken from '../data_structs/access_token';
import HttpErrorInfo from '../data_structs/http_error_info';
import SessionToken from '../data_structs/session_token';
import UserProfile from '../data_structs/user_profile';
import DatabaseClient from '../service/database_client';
import {
  accessTokenExpiryKey,
  accessTokenKey,
  sessionTokenKey,
} from '../utils/parameter_keys';

/** Handler of a HTTP route. */
export default abstract class Handler {
  /** Gets the HTTP request method to handle. */
  public abstract get method(): HttpMethod;
  /** Gets the request path to handle. */
  public abstract get path(): string;

  /**
   * Handles a request that was sent to path {@link path()} with method
   * {@link method()}.
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
      await this.handleLogic(req, res, next, client);
    } catch (e) {
      if (e instanceof HttpErrorInfo) {
        res.status(e.statusCode).send(e.message);
      } else {
        res.sendStatus(500);
      }
    }
  }

  /**
   * Handles a request that was sent to path {@link path()} with method
   * {@link method()}.
   *
   * Child classes should override this method to define the handler's logic.
   * @param req - Information about the request.
   * @param res - For creating and sending the response.
   * @param next - Called to let the next handler (if any) handle the request.
   * @param client - Client for communicating with the database.
   * @returns Content to be use as the HTTP response body.
   * @throws {HttpErrorInfo} Error encountered that requires a HTTP error
   * response to be sent.
   */
  protected abstract handleLogic(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
    client: DatabaseClient,
  ): Promise<void>;
}

/** Represents a HTTP method. */
export enum HttpMethod {
  get,
  post,
  put,
  delete,
}

/** Error messages for HTTP 401 Unauthorised response. */
export const authenticationErrorMessages = {
  invalidSession: 'Session is invalid.',
  invalidAccessToken: 'Access token is invalid',
  incorrectPassword: 'Password is incorrect.',
  notAdmin: 'User is not an admin.',
};

/** Options for cookies. */
export const cookieOptions: CookieOptions = {
  expires: new Date((Math.pow(2, 31) - 1) * 1000),
  sameSite: true,
};

/** Options for cookies that contain sensitive information. */
export const sensitiveCookieOptions: CookieOptions = {
  ...cookieOptions,
  httpOnly: true,
};

/** Utility functions for {@link Handler}. */
export class HandlerUtils {
  /**
   * Adds the session token {@link sessionToken} to the response {@link res} as
   * a cookie.
   * @param res - Response to add the cookie to.
   * @param sessionToken - Session token.
   */
  public static addSessionTokenCookie(
    res: express.Response,
    sessionToken: SessionToken,
  ): void {
    res.cookie(
      sessionTokenKey,
      sessionToken.toString(),
      sensitiveCookieOptions,
    );
  }

  /**
   * Creates an access token for the user who owns the session token
   * {@link sessionToken} and adds it as a cookie to the response {@link res}.
   * @param res - Response to add the cookie to.
   * @param client - Client for communicating with the database.
   * @param sessionToken - Session token.
   * @param accessTokenPrivateKey - Private key for signing access tokens.
   * @param accessTokenExpireMillis - Number of milliseconds until the access
   * token expires.
   * @returns Created {@link AccessToken}.
   */
  public static async addAccessTokenCookie(
    res: express.Response,
    client: DatabaseClient,
    sessionToken: SessionToken,
    accessTokenPrivateKey: string,
    accessTokenExpireMillis: number,
  ): Promise<void> {
    const userProfile: UserProfile | undefined =
      await client.fetchUserProfileFromSessionToken(sessionToken);

    if (userProfile === undefined) {
      throw new HttpErrorInfo(401, authenticationErrorMessages.invalidSession);
    }

    const accessToken: AccessToken = AccessToken.create(
      userProfile,
      accessTokenPrivateKey,
      accessTokenExpireMillis,
    );

    res
      .cookie(accessTokenKey, accessToken.toString(), sensitiveCookieOptions)
      .cookie(
        accessTokenExpiryKey,
        accessToken.expiry.toISOString(),
        cookieOptions,
      );
  }
}
