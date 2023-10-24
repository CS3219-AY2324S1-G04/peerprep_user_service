/**
 * @file Defines {@link Handler}.
 */
import express, { CookieOptions } from 'express';

import HttpErrorInfo from '../data_structs/http_error_info';
import DatabaseClient from '../service/database_client';

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
  incorrectPassword: 'Password is incorrect.',
};

/** Options for session cookie. */
export const sessionCookieOptions: CookieOptions = {
  expires: new Date((Math.pow(2, 31) - 1) * 1000),
  httpOnly: true,
  sameSite: true,
};
