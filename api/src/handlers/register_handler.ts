/**
 * @file Defines {@link RegisterHandler}.
 */
import bcrypt from 'bcrypt';
import express from 'express';
import { ParsedQs } from 'qs';

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

  private static async _parseAndValidateParams(
    client: DatabaseClient,
    query: qs.ParsedQs,
  ): Promise<[ClientModifiableUserProfile, string]> {
    const [username, invalidUsernameInfo]: [string?, InvalidParamInfo?] =
      await RegisterHandler._parseAndValidateUsername(
        client,
        query['username'],
      );
    const [email, invalidEmailInfo]: [string?, InvalidParamInfo?] =
      await RegisterHandler._parseAndValidateEmail(client, query['email']);
    const [password, isInvalidPasswordInfo]: [string?, InvalidParamInfo?] =
      RegisterHandler._parseAndValidatePassword(query['password']);

    const invalidInfo: Array<InvalidParamInfo> = [];

    if (invalidUsernameInfo !== undefined) {
      invalidInfo.push(invalidUsernameInfo);
    }

    if (invalidEmailInfo !== undefined) {
      invalidInfo.push(invalidEmailInfo);
    }

    if (isInvalidPasswordInfo !== undefined) {
      invalidInfo.push(isInvalidPasswordInfo);
    }

    if (invalidInfo.length > 0) {
      throw new HttpErrorInfo(400, JSON.stringify(invalidInfo));
    }

    return [{ username: username!, email: email! }, password!];
  }

  private static async _parseAndValidateUsername(
    client: DatabaseClient,
    usernameRaw: string | ParsedQs | string[] | ParsedQs[] | undefined,
  ): Promise<[string?, InvalidParamInfo?]> {
    let username: string | undefined;
    let invalidParamInfo: InvalidParamInfo | undefined;

    try {
      username = parseUsername(usernameRaw);
    } catch (e) {
      invalidParamInfo = { param: 'username', message: (e as Error).message };
    }

    if (username !== undefined && (await client.isUsernameInUse(username))) {
      invalidParamInfo = {
        param: 'username',
        message: 'Username already in use.',
      };
    }

    return [username, invalidParamInfo];
  }

  private static async _parseAndValidateEmail(
    client: DatabaseClient,
    emailRaw: string | ParsedQs | string[] | ParsedQs[] | undefined,
  ): Promise<[string?, InvalidParamInfo?]> {
    let email: string | undefined;
    let invalidParamInfo: InvalidParamInfo | undefined;

    try {
      email = parseEmail(emailRaw);
    } catch (e) {
      invalidParamInfo = { param: 'email', message: (e as Error).message };
    }

    if (email !== undefined && (await client.isEmailInUse(email))) {
      invalidParamInfo = { param: 'email', message: 'Email already in use.' };
    }

    return [email, invalidParamInfo];
  }

  private static _parseAndValidatePassword(
    passwordRaw: string | ParsedQs | string[] | ParsedQs[] | undefined,
  ): [string?, InvalidParamInfo?] {
    try {
      return [parsePassword(passwordRaw), undefined];
    } catch (e) {
      return [undefined, { param: 'password', message: (e as Error).message }];
    }
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
      await RegisterHandler._parseAndValidateParams(client, req.query);

    await RegisterHandler._createUser(
      client,
      userProfile,
      password,
      this._hashSaltRounds,
    );

    res.sendStatus(200);
  }
}
