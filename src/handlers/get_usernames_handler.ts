/**
 * @file Defines {@link GetUserIdentityHandler}.
 */
import express from 'express';

import HttpErrorInfo from '../data_structs/http_error_info';
import UserId from '../data_structs/user_id';
import Username from '../data_structs/username';
import DatabaseClient from '../service/database_client';
import { userIdsKey } from '../utils/parameter_keys';
import Handler, { HttpMethod } from './handler';

/**
 * Handles REST API requests for getting the usernames of the users whose user
 * ID was specified.
 */
export default class GetUsernameHandler extends Handler {
  /** @inheritdoc */
  public override get method(): HttpMethod {
    return HttpMethod.get;
  }

  /** @inheritdoc */
  public override get subPath(): string {
    return 'users/all/username';
  }

  private static _parseParams(query: qs.ParsedQs): UserId[] {
    if (query[userIdsKey] === undefined) {
      throw new HttpErrorInfo(400, 'User IDs must be specified.');
    }

    let rawUserIds: unknown;
    try {
      rawUserIds = JSON.parse(query[userIdsKey] as string);

      if (!Array.isArray(rawUserIds)) {
        throw Error();
      }
    } catch (e) {
      throw new HttpErrorInfo(
        400,
        JSON.stringify({ [userIdsKey]: 'User IDs must be a JSON array.' }),
      );
    }

    try {
      return rawUserIds.map((rawUserId) =>
        UserId.parseNumber(typeof rawUserId !== 'number' ? -1 : rawUserId),
      );
    } catch (e) {
      throw new HttpErrorInfo(
        400,
        JSON.stringify({ [userIdsKey]: (e as Error).message }),
      );
    }
  }

  private static async _fetchUsernames(
    client: DatabaseClient,
    userIds: UserId[],
  ): Promise<{ [userId: string]: string }> {
    const userIdAndUsernames: { userId: UserId; username: Username }[] =
      await client.fetchUsernamesFromUserIds(userIds);

    const result: { [userId: string]: string } = {};
    for (const userIdAndUsername of userIdAndUsernames) {
      result[userIdAndUsername.userId.toString()] =
        userIdAndUsername.username.toString();
    }

    return result;
  }

  /**
   * Gets the usernames of all users whose user ID is contain in the array of
   * user IDs specified in the request. Sends a HTTP 200 response whose body is
   * a JSON string of an object whose keys are the user IDs of users who exist
   * and values are the corresponding usernames.
   * @param req - Information about the request.
   * @param res - For creating and sending the response.
   * @param next - Called to let the next handler (if any) handle the request.
   * @param client - Client for communicating with the database.
   * @throws {HttpErrorInfo} Error 400 if the user IDs is not a JSON array of
   * positive integers. Message contains a JSON string of the reason for the
   * error.
   * @throws {HttpErrorInfo} Error 500 if an unexpected error occurs.
   */
  protected override async handleLogic(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
    client: DatabaseClient,
  ): Promise<void> {
    const userIds: UserId[] = await GetUsernameHandler._parseParams(req.query);
    const userIdToUsername: { [userId: string]: string } =
      await GetUsernameHandler._fetchUsernames(client, userIds);

    res.status(200).send(userIdToUsername);
  }
}
