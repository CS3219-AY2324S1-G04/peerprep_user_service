/**
 * @file Defines {@link Handler}.
 */
import express from 'express';
import pg from 'pg';

/** Interface for all handlers. */
export default interface Handler {
  /** Gets the HTTP request method to handle. */
  get method(): HttpMethod;
  /** Gets the request path to handle. */
  get path(): string;

  /**
   * Handles a request that was sent to path {@link path()} with method
   * {@link method()}.
   * @param req - Information about the request.
   * @param res - For creating and sending the response.
   * @param next - Called to let the next handler (if any) handle the request.
   * @param client - Client for communicating with the database.
   */
  handle(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
    client: pg.ClientBase,
  ): Promise<void>;
}

/** Represents a HTTP method. */
export enum HttpMethod {
  get,
  post,
  put,
  delete,
}
