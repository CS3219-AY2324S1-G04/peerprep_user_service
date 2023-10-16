/**
 * @file Defines {@link LoginHandler}.
 */
import bcrypt from 'bcrypt';
import express from 'express';
import qs from 'qs';

import HttpErrorInfo from '../data_structs/http_error_info';
import Password from '../data_structs/password';
import SessionToken from '../data_structs/session_token';
import Username from '../data_structs/username';
import DatabaseClient from '../service/database_client';
import Handler, { HttpMethod } from './handler';

/** Handles user login. */
export default class LoginHandler extends Handler {
  private static _cookieExpiry: Date = new Date((Math.pow(2, 31) - 1) * 1000);

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

  private static _parseQuery(query: qs.ParsedQs): [Username, Password] {
    let username: Username;
    let password: Password;

    const invalidInfo: { [key: string]: string } = {};

    try {
      username = Username.parse(query['username']);
    } catch (e) {
      invalidInfo['username'] = (e as Error).message;
    }

    try {
      password = Password.parse(query['password']);
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
    username: Username,
    password: Password,
    sessionExpireMillis: number,
  ): Promise<SessionToken> {
    await LoginHandler._verifyIdentity(client, username, password);
    return await LoginHandler._createUserSession(
      client,
      username,
      sessionExpireMillis,
    );
  }

  private static async _verifyIdentity(
    client: DatabaseClient,
    username: Username,
    password: Password,
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
    username: Username,
  ): Promise<string> {
    const passwordHash: string | undefined =
      await client.fetchPasswordHashFromUsername(username);
    if (passwordHash === undefined) {
      throw new HttpErrorInfo(401);
    }

    return passwordHash;
  }

  private static async _doesPasswordMatch(
    password: Password,
    passwordHash: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password.toString(), passwordHash);
  }

  private static async _createUserSession(
    client: DatabaseClient,
    username: Username,
    sessionExpireMillis: number,
  ): Promise<SessionToken> {
    let sessionToken: SessionToken;

    let isEntryCreated: boolean = false;
    while (!isEntryCreated) {
      sessionToken = SessionToken.createNew();

      try {
        await client.createUserSession(
          sessionToken,
          username,
          new Date(Date.now() + sessionExpireMillis),
        );

        isEntryCreated = true;
      } catch (e) {
        if (!client.isUniqueConstraintViolated(e)) {
          throw e;
        }
      }
    }

    return sessionToken!;
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
    const [username, password]: [Username, Password] = LoginHandler._parseQuery(
      req.query,
    );

    const sessionToken: SessionToken = await LoginHandler._authenticate(
      client,
      username,
      password,
      this._sessionExpireMillis,
    );

    res
      .status(200)
      .cookie('session-token', sessionToken.toString(), {
        expires: LoginHandler._cookieExpiry,
        httpOnly: true,
        sameSite: true,
      })
      .cookie('is-logged-in', true, {
        expires: LoginHandler._cookieExpiry,
      })
      .send();
  }
}
