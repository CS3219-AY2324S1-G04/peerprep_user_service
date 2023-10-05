/**
 * @file Defines {@link RegisterHandler}.
 */
import bcrypt from 'bcrypt';
import express from 'express';
import { ParsedQs } from 'qs';

import HttpErrorInfo from '../data_structs/http_error_info';
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
    let username: string;
    let email: string;
    let password: string;

    const invalidInfo: { [key: string]: string } = {};

    try {
      username = await RegisterHandler._parseAndValidateUsername(
        client,
        query['username'],
      );
    } catch (e) {
      invalidInfo['username'] = (e as Error).message;
    }

    try {
      email = await RegisterHandler._parseAndValidateEmail(
        client,
        query['email'],
      );
    } catch (e) {
      invalidInfo['email'] = (e as Error).message;
    }

    try {
      password = parsePassword(query['password']);
    } catch (e) {
      invalidInfo['password'] = (e as Error).message;
    }

    if (Object.keys(invalidInfo).length > 0) {
      throw new HttpErrorInfo(400, JSON.stringify(invalidInfo));
    }

    return [{ username: username!, email: email! }, password!];
  }

  private static async _parseAndValidateUsername(
    client: DatabaseClient,
    usernameRaw: string | ParsedQs | string[] | ParsedQs[] | undefined,
  ): Promise<string> {
    const username: string = parseUsername(usernameRaw);

    if (await client.isUsernameInUse(username)) {
      throw Error('Username already in use.');
    }

    return username;
  }

  private static async _parseAndValidateEmail(
    client: DatabaseClient,
    emailRaw: string | ParsedQs | string[] | ParsedQs[] | undefined,
  ): Promise<string> {
    const email: string = parseEmail(emailRaw);

    if (await client.isEmailInUse(email)) {
      throw Error('Email already in use.');
    }

    return email;
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
          JSON.stringify({
            username: 'Username already in use.',
          }),
        );
      } else if (client.isDuplicateUserProfileEmailError(e)) {
        throw new HttpErrorInfo(
          400,
          JSON.stringify({
            email: 'Email already in use.',
          }),
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
