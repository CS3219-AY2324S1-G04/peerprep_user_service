/**
 * @file Defines {@link DeleteUserHandler}.
 */
import express from 'express';

import HttpErrorInfo from '../data_structs/http_error_info';
import Password from '../data_structs/password';
import PasswordHash from '../data_structs/password_hash';
import SessionToken from '../data_structs/session_token';
import DatabaseClient from '../service/database_client';
import { passwordKey, sessionTokenKey } from '../utils/parameter_keys';
import Handler, { HttpMethod, authenticationErrorMessages } from './handler';

/** Handles deleting the user who sent the request. */
export default class DeleteUserHandler extends Handler {
  public override get method(): HttpMethod {
    return HttpMethod.delete;
  }

  public override get path(): string {
    return '/user-service/user';
  }

  private static _parseQuery(query: qs.ParsedQs): Password {
    let password: Password;

    try {
      password = Password.parse(query[passwordKey]);
    } catch (e) {
      throw new HttpErrorInfo(
        401,
        authenticationErrorMessages.incorrectPassword,
      );
    }

    return password!;
  }

  private static _parseCookie(cookies: {
    [x: string]: string | undefined;
  }): SessionToken {
    try {
      return SessionToken.parse(cookies[sessionTokenKey]);
    } catch (e) {
      throw new HttpErrorInfo(401, authenticationErrorMessages.invalidSession);
    }
  }

  private static async _validatePassword(
    client: DatabaseClient,
    sessionToken: SessionToken,
    password: Password,
  ): Promise<void> {
    const passwordHash: PasswordHash =
      await DeleteUserHandler._fetchPasswordHash(client, sessionToken);

    if (!(await passwordHash.isMatch(password))) {
      throw new HttpErrorInfo(
        401,
        authenticationErrorMessages.incorrectPassword,
      );
    }
  }

  private static async _fetchPasswordHash(
    client: DatabaseClient,
    sessionToken: SessionToken,
  ): Promise<PasswordHash> {
    const passwordHash: PasswordHash | undefined =
      await client.fetchPasswordHashFromSessionToken(sessionToken);

    if (passwordHash === undefined) {
      throw new HttpErrorInfo(401, authenticationErrorMessages.invalidSession);
    }

    return passwordHash;
  }

  private static async _deleteUserProfile(
    client: DatabaseClient,
    sessionToken: SessionToken,
  ): Promise<void> {
    if (!(await client.deleteUserProfile(sessionToken))) {
      throw new HttpErrorInfo(401, authenticationErrorMessages.invalidSession);
    }
  }

  /**
   * Deletes the user who owns the session token stored in the request cookie.
   * Sends a HTTP 200 response.
   * @param req - Information about the request. Sends a HTTP 200 response.
   * @param res - For creating and sending the response.
   * @param next - Called to let the next handler (if any) handle the request.
   * @param client - Client for communicating with the database.
   * @throws {HttpErrorInfo} Error 401 if no session token is found, or the
   * session token is invalid (expired or not owned by any user), or the
   * password provided is incorrect.
   * @throws {HttpErrorInfo} Error 500 if an unexpected error occurs.
   */
  protected override async handleLogic(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
    client: DatabaseClient,
  ): Promise<void> {
    const password: Password = DeleteUserHandler._parseQuery(req.query);
    const sessionToken: SessionToken = DeleteUserHandler._parseCookie(
      req.cookies,
    );

    await DeleteUserHandler._validatePassword(client, sessionToken, password);
    await DeleteUserHandler._deleteUserProfile(client, sessionToken);

    res.sendStatus(200);
  }
}
