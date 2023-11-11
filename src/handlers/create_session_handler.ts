/**
 * @file Defines {@link CreateSessionHandler}.
 */
import express from 'express';
import qs from 'qs';

import HttpErrorInfo from '../data_structs/http_error_info';
import Password from '../data_structs/password';
import PasswordHash from '../data_structs/password_hash';
import SessionToken from '../data_structs/session_token';
import Username from '../data_structs/username';
import DatabaseClient from '../service/database_client';
import { passwordKey, usernameKey } from '../utils/parameter_keys';
import Handler, { HandlerUtils, HttpMethod } from './handler';

/** Handles REST API requests for creating sessions. */
export default class CreateSessionHandler extends Handler {
  private readonly _accessTokenPrivateKey: string;
  private readonly _sessionExpireMillis: number;
  private readonly _accessTokenExpireMillis: number;

  /**
   * @param accessTokenPrivateKey - Private key for creating access tokens.
   * @param sessionExpireMillis - Number of milliseconds a session can can
   * remain valid for.
   * @param accessTokenExpireMillis - Number of milliseconds an access token
   * remains valid for.
   */
  public constructor(
    accessTokenPrivateKey: string,
    sessionExpireMillis: number,
    accessTokenExpireMillis: number,
  ) {
    super();
    this._accessTokenPrivateKey = accessTokenPrivateKey;
    this._sessionExpireMillis = sessionExpireMillis;
    this._accessTokenExpireMillis = accessTokenExpireMillis;
  }

  /** @inheritdoc */
  public override get method(): HttpMethod {
    return HttpMethod.post;
  }

  /** @inheritdoc */
  public override get subPath(): string {
    return 'sessions';
  }

  private static _parseQuery(query: qs.ParsedQs): [Username, Password] {
    let username: Username;
    let password: Password;

    const invalidInfo: { [key: string]: string } = {};

    try {
      username = Username.parse(query[usernameKey]);
    } catch (e) {
      invalidInfo[usernameKey] = (e as Error).message;
    }

    try {
      password = Password.parse(query[passwordKey]);
    } catch (e) {
      invalidInfo[passwordKey] = (e as Error).message;
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
    await CreateSessionHandler._verifyIdentity(client, username, password);
    return await CreateSessionHandler._createUserSession(
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
    const passwordHash: PasswordHash =
      await CreateSessionHandler._fetchPasswordHash(client, username);

    if (!(await passwordHash.isMatch(password))) {
      throw new HttpErrorInfo(401);
    }
  }

  private static async _fetchPasswordHash(
    client: DatabaseClient,
    username: Username,
  ): Promise<PasswordHash> {
    const passwordHash: PasswordHash | undefined =
      await client.fetchPasswordHashFromUsername(username);

    if (passwordHash === undefined) {
      throw new HttpErrorInfo(401);
    }

    return passwordHash;
  }

  private static async _createUserSession(
    client: DatabaseClient,
    username: Username,
    sessionExpireMillis: number,
  ): Promise<SessionToken> {
    let sessionToken: SessionToken;

    let isEntryCreated: boolean = false;
    while (!isEntryCreated) {
      sessionToken = SessionToken.create();

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
   * request are a match. Sends a HTTP 201 response containing the session
   * token, access token, and access token expiry as cookies.
   * @param req - Information about the request.
   * @param res - For creating and sending the response.
   * @param next - Called to let the next handler (if any) handle the request.
   * @param client - Client for communicating with the database.
   * @throws {HttpErrorInfo} Error 400 if the username and/or password are
   * invalid. Message contains a JSON string of the reasons for the error.
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
    const [username, password]: [Username, Password] =
      CreateSessionHandler._parseQuery(req.query);

    const sessionToken: SessionToken = await CreateSessionHandler._authenticate(
      client,
      username,
      password,
      this._sessionExpireMillis,
    );

    await HandlerUtils.addSessionTokenCookie(res, sessionToken);
    await HandlerUtils.addAccessTokenCookie(
      res,
      client,
      sessionToken,
      this._accessTokenPrivateKey,
      this._accessTokenExpireMillis,
    );
    res.status(201).send();
  }
}
