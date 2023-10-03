/**
 * @file Defines {@link RegisterHandler}.
 */
import bcrypt from 'bcrypt';
import express from 'express';

import InvalidParamInfo from '../data_structs/invalid_param_info';
import UserProfile from '../data_structs/user_profile';
import HttpInfoError from '../errors/http_info_error';
import DatabaseClient from '../service/database_client';
import { parseEmail, parsePassword, parseUsername } from '../utils/data_parser';
import Handler, { HttpMethod } from './handler';

/** Handles user registration. */
export default class RegisterHandler implements Handler {
  private readonly _hashSaltRounds: number;

  public constructor(hashSaltRounds: number) {
    this._hashSaltRounds = hashSaltRounds;
  }

  public get method(): HttpMethod {
    return HttpMethod.post;
  }

  public get path(): string {
    return '/user-service/users';
  }

  private static _parseQuery(query: qs.ParsedQs): [UserProfile, string] {
    let username: string;
    let email: string;
    let password: string;

    const invalidInfo: Array<InvalidParamInfo> = [];

    try {
      username = parseUsername(query['username']);
    } catch (e) {
      invalidInfo.push({ field: 'username', message: (e as Error).message });
    }

    try {
      email = parseEmail(query['email']);
    } catch (e) {
      invalidInfo.push({ field: 'email', message: (e as Error).message });
    }

    try {
      password = parsePassword(query['password']);
    } catch (e) {
      invalidInfo.push({ field: 'password', message: (e as Error).message });
    }

    if (invalidInfo.length > 0) {
      throw new HttpInfoError(400, JSON.stringify(invalidInfo));
    }

    return [{ username: username!, email: email! }, password!];
  }

  private static async _createUser(
    client: DatabaseClient,
    userProfile: UserProfile,
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
    userProfile: UserProfile,
    passwordHash: string,
  ): Promise<void> {
    try {
      await client.createUserProfileAndCredential(userProfile, passwordHash);
    } catch (e) {
      if (client.isDuplicateUserProfileUsernameError(e)) {
        throw new HttpInfoError(400, 'Username already in use.');
      } else if (client.isDuplicateUserProfileEmailError(e)) {
        throw new HttpInfoError(400, 'Email already in use.');
      }

      throw e;
    }
  }

  /**
   * Creates a new user using the details specified in the request. Sends a HTTP
   * 200 response.
   *
   * If the username, email, or password are invalid, sends a HTTP 400 response
   * containing the reason for the error in the response message.
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
      const [userProfile, password]: [UserProfile, string] =
        RegisterHandler._parseQuery(req.query);

      await RegisterHandler._createUser(
        client,
        userProfile,
        password,
        this._hashSaltRounds,
      );

      res.sendStatus(200);
    } catch (e) {
      if (e instanceof HttpInfoError) {
        res.status(e.statusCode).send(e.message);
      } else {
        res.sendStatus(500);
      }
    }
  }
}
