/**
 * @file Defines {@link LoginHandler}.
 */
import bcrypt from 'bcrypt';
import express from 'express';
import qs from 'qs';
import { v4 as uuidV4 } from 'uuid';

import HttpErrorInfo from '../data_structs/http_error_info';
import DatabaseClient from '../service/database_client';
import { parsePassword, parseUsername } from '../utils/data_parser';
import Handler, { HttpMethod } from './handler';

/** Handles user login. */
export default class LoginHandler extends Handler {
  private readonly _sessionExpireMillis: number;

  public constructor(sessionExpireMillis: number) {
    super();
    this._sessionExpireMillis = sessionExpireMillis;
  }

  public override get method(): HttpMethod {
    return HttpMethod.post;
  }

  public override get path(): string {
    return '/user-service/sessions';
  }

  private static _parseQuery(query: qs.ParsedQs): [string, string] {
    let username: string;
    let password: string;

    const invalidInfo: { [key: string]: string } = {};

    try {
      username = parseUsername(query['username']);
    } catch (e) {
      invalidInfo['username'] = (e as Error).message;
    }

    try {
      password = parsePassword(query['password']);
    } catch (e) {
      invalidInfo['password'] = (e as Error).message;
    }

    if (Object.keys(invalidInfo).length > 0) {
      throw new HttpErrorInfo(400, JSON.stringify(invalidInfo));
    }

    return [username!, password!];
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
      throw new HttpErrorInfo(401);
    }
  }

  private static async _fetchPasswordHash(
    client: DatabaseClient,
    username: string,
  ): Promise<string> {
    const passwordHash: string | undefined =
      await client.fetchPasswordHashFromUsername(username);
    if (passwordHash === undefined) {
      throw new HttpErrorInfo(401);
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
   * @param req - Information about the request.
   * @param res - For creating and sending the response.
   * @param next - Called to let the next handler (if any) handle the request.
   * @param client - Client for communicating with the database.
   * @throws {HttpErrorInfo} Error 400 if the username and/or password are
   * invalid (missing, empty etc.). Message contains a JSON string of the
   * reasons for the error.
   * @throws {HttpErrorInfo} Error 401 if no user with the username exist, or
   * the username and password do not match.
   * @throws {HttpErrorInfo} Error 500 if an unexpected error occurs.
   */
  public override async handleLogic(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
    client: DatabaseClient,
  ): Promise<void> {
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
      .cookie('session-token', sessionToken[0], { expires: sessionToken[1] })
      .send();
  }
}
