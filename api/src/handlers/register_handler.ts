/**
 * @file Defines {@link RegisterHandler}.
 */
import express from 'express';

import EmailAddress from '../data_structs/email_address';
import HttpErrorInfo from '../data_structs/http_error_info';
import Password from '../data_structs/password';
import ClientModifiableUserProfile from '../data_structs/uncreated_user_profile';
import Username from '../data_structs/username';
import DatabaseClient from '../service/database_client';
import Handler, { HttpMethod } from './handler';
import {
  emailAddressKey,
  passwordKey,
  usernameKey,
} from '../utils/parameter_keys';
import PasswordHash from '../data_structs/password_hash';

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

  private static async _parseParams(
    client: DatabaseClient,
    query: qs.ParsedQs,
  ): Promise<[ClientModifiableUserProfile, Password]> {
    let username: Username | undefined = undefined;
    let emailAddress: EmailAddress | undefined = undefined;
    let password: Password | undefined = undefined;

    const invalidInfo: { [key: string]: string } = {};

    try {
      username = Username.parseAndValidate(query[usernameKey]);
    } catch (e) {
      invalidInfo[usernameKey] = (e as Error).message;
    }

    try {
      emailAddress = EmailAddress.parseAndValidate(query[emailAddressKey]);
    } catch (e) {
      invalidInfo[emailAddressKey] = (e as Error).message;
    }

    try {
      password = Password.parseAndValidate(query[passwordKey]);
    } catch (e) {
      invalidInfo[passwordKey] = (e as Error).message;
    }

    if (username !== undefined && (await client.isUsernameInUse(username))) {
      invalidInfo[usernameKey] = 'Username already in use.';
    }

    if (
      emailAddress !== undefined &&
      (await client.isEmailAddressInUse(emailAddress))
    ) {
      invalidInfo[emailAddressKey] = 'Email address already in use.';
    }

    if (Object.keys(invalidInfo).length > 0) {
      throw new HttpErrorInfo(400, JSON.stringify(invalidInfo));
    }

    return [{ username: username!, emailAddress: emailAddress! }, password!];
  }

  private static async _createUser(
    client: DatabaseClient,
    userProfile: ClientModifiableUserProfile,
    password: Password,
    hashCost: number,
  ): Promise<void> {
    const passwordHash: PasswordHash = await PasswordHash.hash(
      password,
      hashCost,
    );

    await RegisterHandler._createUserProfileAndCredential(
      client,
      userProfile,
      passwordHash,
    );
  }

  private static async _createUserProfileAndCredential(
    client: DatabaseClient,
    userProfile: ClientModifiableUserProfile,
    passwordHash: PasswordHash,
  ): Promise<void> {
    await client.createUserProfileAndCredential(userProfile, passwordHash);
  }

  /**
   * Creates a new user using the details specified in the request. Sends a HTTP
   * 200 response.
   * @param req - Information about the request.
   * @param res - For creating and sending the response.
   * @param next - Called to let the next handler (if any) handle the request.
   * @param client - Client for communicating with the database.
   * @throws {HttpErrorInfo} Error 400 if the username, email address, or
   * password are invalid. Message contains a JSON string of the reasons for the
   * error.
   * @throws {HttpErrorInfo} Error 500 if an unexpected error occurs.
   */
  public override async handleLogic(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
    client: DatabaseClient,
  ): Promise<void> {
    const [userProfile, password]: [ClientModifiableUserProfile, Password] =
      await RegisterHandler._parseParams(client, req.query);

    await RegisterHandler._createUser(
      client,
      userProfile,
      password,
      this._hashSaltRounds,
    );

    res.sendStatus(200);
  }
}
