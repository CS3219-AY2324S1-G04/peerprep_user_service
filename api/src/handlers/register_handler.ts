/**
 * @file Defines {@link RegisterHandler}.
 */
import bcrypt from 'bcrypt';
import express from 'express';
import pg from 'pg';

import UserProfile from '../data_structs/user_profile';
import HttpInfoError from '../errors/http_info_error';
import { parseEmail, parsePassword, parseUsername } from '../utils/data_parser';
import {
  createUserProfileAndCredential,
  isDuplicateUserProfileEmailError,
  isDuplicateUserProfileUsernameError,
} from '../utils/database_util';
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
    return '/user_service/register';
  }

  private static _parseQuery(query: qs.ParsedQs): [UserProfile, string] {
    try {
      const userProfile: UserProfile = new UserProfile(
        undefined,
        parseUsername(query['username']),
        parseEmail(query['email']),
        undefined,
      );
      const password: string = parsePassword(query['password']);

      return [userProfile, password];
    } catch (e) {
      throw new HttpInfoError(400, (e as Error).message);
    }
  }

  private static async _createUser(
    client: pg.ClientBase,
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
    client: pg.ClientBase,
    userProfile: UserProfile,
    passwordHash: string,
  ): Promise<void> {
    try {
      await createUserProfileAndCredential(client, userProfile, passwordHash);
    } catch (e) {
      if (isDuplicateUserProfileUsernameError(e)) {
        throw new HttpInfoError(400, 'Username already in use.');
      } else if (isDuplicateUserProfileEmailError(e)) {
        throw new HttpInfoError(400, 'Email already in use.');
      }

      throw e;
    }
  }

  /**
   * Creates a new user in the database using the details specified in the
   * request. Sends a HTTP 200 response.
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
    client: pg.ClientBase,
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
