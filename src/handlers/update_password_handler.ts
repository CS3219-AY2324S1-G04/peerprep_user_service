/**
 * @file Defines {@link UpdatePasswordHandler}.
 */
import express from 'express';

import HttpErrorInfo from '../data_structs/http_error_info';
import Password from '../data_structs/password';
import PasswordHash from '../data_structs/password_hash';
import SessionToken from '../data_structs/session_token';
import DatabaseClient from '../service/database_client';
import {
  newPasswordKey,
  passwordKey,
  sessionTokenKey,
} from '../utils/parameter_keys';
import Handler, { HttpMethod, authenticationErrorMessages } from './handler';

/** Handles changing the password of the user who sent the request. */
export default class UpdatePasswordHandler extends Handler {
  private readonly _hashCost: number;

  public constructor(hashCost: number) {
    super();
    this._hashCost = hashCost;
  }

  public override get method(): HttpMethod {
    return HttpMethod.put;
  }

  public override get subPath(): string {
    return 'user/password';
  }

  private static _parseCookies(cookies: {
    [x: string]: string | undefined;
  }): SessionToken {
    try {
      return SessionToken.parse(cookies[sessionTokenKey]);
    } catch (e) {
      throw new HttpErrorInfo(401, authenticationErrorMessages.invalidSession);
    }
  }

  private static async _parseParams(
    query: qs.ParsedQs,
  ): Promise<[Password, Password]> {
    let password: Password;
    let newPassword: Password;

    try {
      password = Password.parse(query[passwordKey]);
    } catch (e) {
      throw new HttpErrorInfo(
        401,
        authenticationErrorMessages.incorrectPassword,
      );
    }

    try {
      newPassword = Password.parse(query[newPasswordKey]);
    } catch (e) {
      throw new HttpErrorInfo(
        400,
        JSON.stringify({
          newPasswordKey: (e as Error).message,
        }),
      );
    }

    return [password, newPassword];
  }

  private static async _validatePassword(
    client: DatabaseClient,
    sessionToken: SessionToken,
    password: Password,
  ): Promise<void> {
    const passwordHash: PasswordHash =
      await UpdatePasswordHandler._fetchPasswordHash(client, sessionToken);

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

  private static async _updatePassword(
    client: DatabaseClient,
    newPassword: Password,
    sessionToken: SessionToken,
    hashCost: number,
  ): Promise<void> {
    const newPasswordHash: PasswordHash = await PasswordHash.hash(
      newPassword,
      hashCost,
    );

    if (!(await client.updatePasswordHash(newPasswordHash, sessionToken))) {
      throw new HttpErrorInfo(401, authenticationErrorMessages.invalidSession);
    }
  }

  /**
   * Updates the password of the user who owns the session token stored in the
   * request cookie. Sends a HTTP 200 response.
   * @param req - Information about the request.
   * @param res - For creating and sending the response.
   * @param next - Called to let the next handler (if any) handle the request.
   * @param client - Client for communicating with the database.
   * @throws {HttpErrorInfo} Error 400 if the new password is invalid. Message
   * contains a JSON string of the reason for the error.
   * @throws {HttpErrorInfo} Error 401 if no session token is specified, or the
   * session token is invalid, or the provided current password is incorrect.
   * @throws {HttpErrorInfo} Error 500 if an unexpected error occurs.
   */
  public override async handleLogic(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
    client: DatabaseClient,
  ): Promise<void> {
    const sessionToken: SessionToken = UpdatePasswordHandler._parseCookies(
      req.cookies,
    );
    const [password, newPassword]: [Password, Password] =
      await UpdatePasswordHandler._parseParams(req.query);

    await UpdatePasswordHandler._validatePassword(
      client,
      sessionToken,
      password,
    );
    await UpdatePasswordHandler._updatePassword(
      client,
      newPassword,
      sessionToken,
      this._hashCost,
    );

    res.sendStatus(200);
  }
}
