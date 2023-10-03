/**
 * @file Defines {@link LoginHandler}.
 */
import bcrypt from 'bcrypt';
import express from 'express';
import qs from 'qs';
import { v4 as uuidV4 } from 'uuid';

import HttpInfoError from '../errors/http_info_error';
import DatabaseClient from '../service/database_client';
import { parsePassword, parseUsername } from '../utils/data_parser';
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
    return '/user-service/sessions';
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
    client: DatabaseClient,
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
    client: DatabaseClient,
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
    client: DatabaseClient,
    username: string,
  ): Promise<string> {
    const passwordHash: string | undefined =
      await client.fetchPasswordHashFromUsername(username);
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
    client: DatabaseClient,
    username: string,
    sessionExpireMillis: number,
  ): Promise<[string, Date]> {
    const expireTime: Date = new Date(Date.now() + sessionExpireMillis);

    let token: string = '';

    let isEntryCreated: boolean = false;
    while (!isEntryCreated) {
      token = uuidV4();

      try {
        await client.createUserSession(token, username, expireTime);

        isEntryCreated = true;
      } catch (e) {
        if (!client.isDuplicateUserSessionTokenError(e)) {
          throw e;
        }
      }
    }

    return [token, expireTime];
  }

  /**
   * Creates a new user session if the username and password provided in the
   * request are a match. Sends a HTTP 200 response.
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
    client: DatabaseClient,
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
