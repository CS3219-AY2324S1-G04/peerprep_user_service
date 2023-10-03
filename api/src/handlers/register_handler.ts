/**
 * @file Defines {@link RegisterHandler}.
 */
import bcrypt from 'bcrypt';
import express from 'express';

import HttpErrorInfo from '../data_structs/http_error_info';
import InvalidParamInfo from '../data_structs/invalid_param_info';
import ClientModifiableUserProfile from '../data_structs/uncreated_user_profile';
import DatabaseClient from '../service/database_client';
import { parseEmail, parsePassword, parseUsername } from '../utils/data_parser';
import Handler, { HttpMethod } from './handler';

/** Handles user registration. */
export default class RegisterHandler extends Handler {
  private readonly _hashSaltRounds: number;

  public constructor(hashSaltRounds: number) {
    super();
    this._hashSaltRounds = hashSaltRounds;
  }

  public override get method(): HttpMethod {
    return HttpMethod.post;
  }

  public override get path(): string {
    return '/user-service/users';
  }

  private static _parseQuery(
    query: qs.ParsedQs,
  ): [ClientModifiableUserProfile, string] {
    let username: string;
    let email: string;
    let password: string;

    const invalidInfo: Array<InvalidParamInfo> = [];

    try {
      username = parseUsername(query['username']);
    } catch (e) {
      invalidInfo.push({ param: 'username', message: (e as Error).message });
    }

    try {
      email = parseEmail(query['email']);
    } catch (e) {
      invalidInfo.push({ param: 'email', message: (e as Error).message });
    }

    try {
      password = parsePassword(query['password']);
    } catch (e) {
      invalidInfo.push({ param: 'password', message: (e as Error).message });
    }

    if (invalidInfo.length > 0) {
      throw new HttpErrorInfo(400, JSON.stringify(invalidInfo));
    }

    return [{ username: username!, email: email! }, password!];
  }

  private static async _createUser(
    client: DatabaseClient,
    userProfile: ClientModifiableUserProfile,
    password: string,
    hashSaltRounds: number,
  ): Promise<void> {
    const passwordHash: string = await RegisterHandler._hashPassword(
      password,
      hashSaltRounds,
    );

    await RegisterHandler._createUserProfileAndCredential(
      client,
      userProfile,
      passwordHash,
    );
  }

  private static async _hashPassword(
    password: string,
    hashSaltRounds: number,
  ): Promise<string> {
    return await bcrypt.hash(password, await bcrypt.genSalt(hashSaltRounds));
  }

  private static async _createUserProfileAndCredential(
    client: DatabaseClient,
    userProfile: ClientModifiableUserProfile,
    passwordHash: string,
  ): Promise<void> {
    try {
      await client.createUserProfileAndCredential(userProfile, passwordHash);
    } catch (e) {
      if (client.isDuplicateUserProfileUsernameError(e)) {
        throw new HttpErrorInfo(
          400,
          JSON.stringify([
            {
              param: 'username',
              message: 'Username already in use.',
            },
          ]),
        );
      } else if (client.isDuplicateUserProfileEmailError(e)) {
        throw new HttpErrorInfo(
          400,
          JSON.stringify([
            {
              param: 'email',
              message: 'Email already in use.',
            },
          ]),
        );
      }

      throw e;
    }
  }

  /**
   * Creates a new user using the details specified in the request. Sends a HTTP
   * 200 response.
   * @param req - Information about the request.
   * @param res - For creating and sending the response.
   * @param next - Called to let the next handler (if any) handle the request.
   * @param client - Client for communicating with the database.
   * @throws {HttpErrorInfo} Error 400 if the username, email, or password are
   * invalid. Message contains a JSON string of the reasons for the error.
   * @throws {HttpErrorInfo} Error 500 if an unexpected error occurs.
   */
  public override async handleLogic(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
    client: DatabaseClient,
  ): Promise<void> {
    const [userProfile, password]: [ClientModifiableUserProfile, string] =
      RegisterHandler._parseQuery(req.query);

    await RegisterHandler._createUser(
      client,
      userProfile,
      password,
      this._hashSaltRounds,
    );

    res.sendStatus(200);
  }
}
