/**
 * @file Defines {@link LoginHandler}.
 */
import bcrypt from 'bcrypt';
import express from 'express';
import pg from 'pg';
import qs from 'qs';
import { v4 as uuidV4 } from 'uuid';

import HttpInfoError from '../../errors/http_info_error';
import { parsePassword, parseUsername } from '../../utils/data_parser';
import {
  createUserSession,
  fetchPasswordHashFromUsername,
  isDuplicateUserSessionTokenError,
} from '../../utils/database_util';
import Handler, { HttpMethod } from './handler';

/** Handles user login. */
export default class LoginHandler implements Handler {
  private readonly _sessionExpireMillis: number;

  public constructor(sessionExpireMillis: number) {
    this._sessionExpireMillis = sessionExpireMillis;
  }

  public get method(): HttpMethod {
    return HttpMethod.post;
  }

  public get path(): string {
    return '/user_service/login';
  }

  private static _parseQuery(query: qs.ParsedQs): [string, string] {
    try {
      const username = parseUsername(query['username']);
      const password = parsePassword(query['password']);

      return [username, password];
    } catch (e) {
      throw new HttpInfoError(400, (e as Error).message);
    }
  }

  private static async _authenticate(
    client: pg.ClientBase,
    username: string,
    password: string,
    sessionExpireMillis: number,
  ): Promise<[string, Date]> {
    await LoginHandler._verifyIdentity(client, username, password);
    return await LoginHandler._createUserSession(
      client,
      username,
      sessionExpireMillis,
    );
  }

  private static async _verifyIdentity(
    client: pg.ClientBase,
    username: string,
    password: string,
  ): Promise<void> {
    const passwordHash: string = await LoginHandler._fetchPasswordHash(
      client,
      username,
    );

    if (!(await LoginHandler._doesPasswordMatch(password, passwordHash))) {
      throw new HttpInfoError(401);
    }
  }

  private static async _fetchPasswordHash(
    client: pg.ClientBase,
    username: string,
  ): Promise<string> {
    const passwordHash: string | undefined =
      await fetchPasswordHashFromUsername(client, username);
    if (passwordHash === undefined) {
      throw new HttpInfoError(401);
    }

    return passwordHash;
  }

  private static async _doesPasswordMatch(
    password: string,
    passwordHash: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, passwordHash);
  }

  private static async _createUserSession(
    client: pg.ClientBase,
    username: string,
    sessionExpireMillis: number,
  ): Promise<[string, Date]> {
    const loginTime: Date = new Date(Date.now());
    const expireTime: Date = new Date(Date.now() + sessionExpireMillis);

    let token: string = '';

    let isEntryCreated: boolean = false;
    while (!isEntryCreated) {
      token = uuidV4();

      try {
        await createUserSession(client, token, username, loginTime, expireTime);

        isEntryCreated = true;
      } catch (e) {
        if (!isDuplicateUserSessionTokenError(e)) {
          throw e;
        }
      }
    }

    return [token, expireTime];
  }

  /**
   * Creates a new user session in the database if the username and password
   * provided in the request are a match. Sends a HTTP 200 response.
   *
   * If the username and/or password are invalid (missing, empty etc.), sends
   * a HTTP 400 response containing the reason for the error in the response
   * message.
   *
   * If no user with the username exist, or the username and password do not
   * match, sends a HTTP 401 response.
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
      const [username, password]: [string, string] = LoginHandler._parseQuery(
        req.query,
      );

      const sessionToken: [string, Date] = await LoginHandler._authenticate(
        client,
        username,
        password,
        this._sessionExpireMillis,
      );

      res
        .status(200)
        .cookie('session_token', sessionToken[0], { expires: sessionToken[1] })
        .send();
    } catch (e) {
      if (e instanceof HttpInfoError) {
        res.status(e.statusCode).send(e.message);
      } else {
        res.sendStatus(500);
      }
    }
  }
}
