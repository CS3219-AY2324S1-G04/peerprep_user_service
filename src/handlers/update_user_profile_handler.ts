/**
 * @file Defines {@link UpdateUserProfileHandler}.
 */
import express from 'express';

import EmailAddress from '../data_structs/email_address';
import HttpErrorInfo from '../data_structs/http_error_info';
import SessionToken from '../data_structs/session_token';
import ClientModifiableUserProfile from '../data_structs/uncreated_user_profile';
import Username from '../data_structs/username';
import DatabaseClient from '../service/database_client';
import {
  emailAddressKey,
  sessionTokenKey,
  usernameKey,
} from '../utils/parameter_keys';
import Handler, { HttpMethod, authenticationErrorMessages } from './handler';

/** Handles updating the profile of the user who sent the request. */
export default class UpdateUserProfileHandler extends Handler {
  public override get method(): HttpMethod {
    return HttpMethod.put;
  }

  public override get path(): string {
    return '/user-service/user/profile';
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

  private static async _parseParams(
    client: DatabaseClient,
    query: qs.ParsedQs,
    sessionToken: SessionToken,
  ): Promise<ClientModifiableUserProfile> {
    let username: Username | undefined = undefined;
    let emailAddress: EmailAddress | undefined = undefined;

    const invalidInfo: { [key: string]: string } = {};

    try {
      username = await Username.parseAndValidate(query[usernameKey]);
    } catch (e) {
      invalidInfo[usernameKey] = (e as Error).message;
    }

    try {
      emailAddress = EmailAddress.parseAndValidate(query[emailAddressKey]);
    } catch (e) {
      invalidInfo[emailAddressKey] = (e as Error).message;
    }

    if (
      username !== undefined &&
      (await client.isUsernameInUse(username, sessionToken))
    ) {
      invalidInfo[usernameKey] = 'Username already in use.';
    }

    if (
      emailAddress !== undefined &&
      (await client.isEmailAddressInUse(emailAddress, sessionToken))
    ) {
      invalidInfo[emailAddressKey] = 'Email address already in use.';
    }

    if (Object.keys(invalidInfo).length > 0) {
      throw new HttpErrorInfo(400, JSON.stringify(invalidInfo));
    }

    return { username: username!, emailAddress: emailAddress! };
  }

  private static async _updateUserProfile(
    client: DatabaseClient,
    userProfile: ClientModifiableUserProfile,
    sessionToken: SessionToken,
  ): Promise<void> {
    if (!(await client.updateUserProfile(userProfile, sessionToken))) {
      throw new HttpErrorInfo(401, authenticationErrorMessages.invalidSession);
    }
  }

  /**
   * Updates the user profile belonging to the user who owns the session token
   * stored in the request cookie. Sends a HTTP 200 response.
   * @param req - Information about the request.
   * @param res - For creating and sending the response.
   * @param next - Called to let the next handler (if any) handle the request.
   * @param client - Client for communicating with the database.
   * @throws {HttpErrorInfo} Error 401 if no session token is found or the
   * session token is invalid. A session token can be invalid if it is expired
   * or is not owned by any user.
   * @throws {HttpErrorInfo} Error 400 if the updated user profile values are
   * invalid. Message contains a JSON string of the reasons for the error.
   * @throws {HttpErrorInfo} Error 500 if an unexpected error occurs.
   */
  public override async handleLogic(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
    client: DatabaseClient,
  ): Promise<void> {
    const sessionToken: SessionToken = UpdateUserProfileHandler._parseCookie(
      req.cookies,
    );
    const userProfile: ClientModifiableUserProfile =
      await UpdateUserProfileHandler._parseParams(
        client,
        req.query,
        sessionToken,
      );

    await UpdateUserProfileHandler._updateUserProfile(
      client,
      userProfile,
      sessionToken,
    );

    res.sendStatus(200);
  }
}
