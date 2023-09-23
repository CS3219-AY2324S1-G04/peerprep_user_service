/**
 * @file Defines {@link App}.
 */
import cookieParser from 'cookie-parser';
import express from 'express';
import pg from 'pg';

import Handler, { HttpMethod } from './handlers/handler';

/** Represents the app. */
export default class App {
  private readonly _app: express.Application;
  private readonly _port: number;
  private readonly _pgPool: pg.Pool;

  /**
   * Setup the app.
   * @param port - Port to listen on.
   * @param pgPool - Pool of postgres clients to be used by a handler when
   * handling an API request.
   * @param handlers - Handlers for handling API requests.
   */
  public constructor(port: number, pgPool: pg.Pool, handlers: Handler[]) {
    this._app = express();
    this._app.use(cookieParser());

    this._port = port;
    this._pgPool = pgPool;

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
      client: pg.ClientBase,
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
      const client: pg.PoolClient = await this._pgPool.connect();
      await handle(req, res, next, client);
      client.release();
    };
  }
}
