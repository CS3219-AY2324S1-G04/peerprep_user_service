/**
 * @file Defines {@link App}.
 */
import cookieParser from 'cookie-parser';
import express from 'express';

import Handler, { HttpMethod } from './handlers/handler';
import DatabaseClient from './service/database_client';

/** Represents the app. */
export default class App {
  private readonly _app: express.Application;
  private readonly _port: number;
  private readonly _database: DatabaseClient;

  /**
   * Setup the app.
   * @param port - Port to listen on.
   * @param client - Client for communicating with the database.
   * @param handlers - Handlers for handling API requests.
   */
  public constructor(
    port: number,
    client: DatabaseClient,
    handlers: Handler[],
  ) {
    this._app = express();
    this._app.use(cookieParser());

    this._port = port;
    this._database = client;

    for (const handler of handlers) {
      switch (handler.method) {
        case HttpMethod.get:
          this._app.get(
            handler.path,
            this._wrapHandle(handler.handle.bind(handler)),
          );
          break;
        case HttpMethod.post:
          this._app.post(
            handler.path,
            this._wrapHandle(handler.handle.bind(handler)),
          );
          break;
        case HttpMethod.put:
          this._app.put(
            handler.path,
            this._wrapHandle(handler.handle.bind(handler)),
          );
          break;
        case HttpMethod.delete:
          this._app.delete(
            handler.path,
            this._wrapHandle(handler.handle.bind(handler)),
          );
          break;
      }
    }
  }

  /** Starts the app. */
  public start(): void {
    this._app.listen(this._port, '0.0.0.0', () => {
      console.log(`App is listening on ${this._port}`);
    });
  }

  private _wrapHandle(
    handle: (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
      client: DatabaseClient,
    ) => Promise<void>,
  ): (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => Promise<void> {
    return async (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      await handle(req, res, next, this._database);
    };
  }
}
