/**
 * @file Defines {@link PostgresDatabaseClient}.
 */
import { DataSource, MoreThan } from 'typeorm';

import EmailAddress from '../data_structs/email_address';
import SessionToken from '../data_structs/session_token';
import ClientModifiableUserProfile from '../data_structs/uncreated_user_profile';
import UserId from '../data_structs/user_id';
import UserIdentity from '../data_structs/user_identity';
import UserProfile from '../data_structs/user_profile';
import Username from '../data_structs/username';
import UserCredentialEntity from '../entities/user_credential';
import UserProfileEntity from '../entities/user_profile';
import UserSessionEntity from '../entities/user_session';
import UserRole, { parseUserRole } from '../enums/user_role';
import DatabaseClient, { DatabaseClientConfig } from './database_client';

export class PostgresDatabaseClient implements DatabaseClient {
  private _dataSource: DataSource;

  /**
   * @param config - Configs for the database client.
   */
  public constructor(config: DatabaseClientConfig) {
    this._dataSource = new DataSource({
      type: 'postgres',
      password: config.password,
      username: config.user,
      host: config.host,
      port: config.port,
      database: config.databaseName,
      entities: [UserProfileEntity, UserCredentialEntity, UserSessionEntity],
      connectTimeoutMS: config.connectionTimeoutMillis,
      poolSize: config.maxClientCount,
      synchronize: false,
    });
  }

  public async initialise(): Promise<void> {
    await this._dataSource.initialize();
  }

  public async isUsernameInUse(
    username: Username,
    sessionToken?: SessionToken,
  ): Promise<boolean> {
    const userIdFromUsername: number | undefined =
      await this._getUserIdFromUsername(username);

    if (userIdFromUsername === undefined) {
      return false;
    }

    const userIdFromSessionToken: number | undefined =
      sessionToken === undefined
        ? undefined
        : await this._getUserIdFromSessionToken(sessionToken);

    return userIdFromUsername !== userIdFromSessionToken;
  }

  public async isEmailInUse(
    email: EmailAddress,
    sessionToken?: SessionToken,
  ): Promise<boolean> {
    const userIdFromEmail: number | undefined =
      await this._getUserIdFromEmail(email);

    if (userIdFromEmail === undefined) {
      return false;
    }

    const userIdFromSessionToken: number | undefined =
      sessionToken === undefined
        ? undefined
        : await this._getUserIdFromSessionToken(sessionToken);

    return userIdFromEmail !== userIdFromSessionToken;
  }

  public async fetchPasswordHashFromUsername(
    username: Username,
  ): Promise<string | undefined> {
    const userIdFromUsername: number | undefined =
      await this._getUserIdFromUsername(username);

    if (userIdFromUsername === undefined) {
      return undefined;
    }

    return (
      await this._dataSource.getRepository(UserCredentialEntity).findOne({
        select: { passwordHash: true },
        where: { userId: userIdFromUsername },
      })
    )?.passwordHash;
  }

  public async fetchUserProfileFromSessionToken(
    sessionToken: SessionToken,
  ): Promise<UserProfile | undefined> {
    const userIdFromSessionToken: number | undefined =
      await this._getUserIdFromSessionToken(sessionToken);

    if (userIdFromSessionToken === undefined) {
      return undefined;
    }

    const userProfile: UserProfileEntity | undefined =
      (await this._dataSource
        .getRepository(UserProfileEntity)
        .findOneBy({ userId: userIdFromSessionToken })) ?? undefined;

    if (userProfile === undefined) {
      return undefined;
    }

    return {
      userId: UserId.parseNumber(userProfile.userId),
      username: Username.parse(userProfile.username),
      email: EmailAddress.parse(userProfile.email),
      userRole: parseUserRole(userProfile.role),
    };
  }

  public async fetchUserIdentityFromSessionToken(
    sessionToken: SessionToken,
  ): Promise<UserIdentity | undefined> {
    const userProfile: UserProfile | undefined =
      await this.fetchUserProfileFromSessionToken(sessionToken);

    if (userProfile === undefined) {
      return undefined;
    }

    return {
      userId: userProfile.userId,
      userRole: userProfile.userRole,
    };
  }

  public async createUserProfileAndCredential(
    userProfile: ClientModifiableUserProfile,
    passwordHash: string,
  ): Promise<void> {
    const result = await this._dataSource
      .getRepository(UserProfileEntity)
      .insert({
        username: userProfile.username.toString(),
        email: userProfile.email.toString(),
      });

    await this._dataSource.getRepository(UserCredentialEntity).insert({
      userId: result.identifiers[0].userId,
      passwordHash: passwordHash,
    });
  }

  public async createUserSession(
    sessionToken: SessionToken,
    username: Username,
    expireTime: Date,
  ): Promise<void> {
    const userIdFromUsername: number = (
      await this._dataSource.getRepository(UserProfileEntity).findOneOrFail({
        select: { userId: true },
        where: { username: username.toString() },
      })
    ).userId;

    await this._dataSource.getRepository(UserSessionEntity).insert({
      sessionToken: sessionToken.toString(),
      userId: userIdFromUsername,
      expireTime: expireTime,
    });
  }

  public async updateUserProfile(
    userProfile: ClientModifiableUserProfile,
    sessionToken: SessionToken,
  ): Promise<boolean> {
    const userIdFromSessionToken: number | undefined =
      await this._getUserIdFromSessionToken(sessionToken);

    if (userIdFromSessionToken === undefined) {
      return false;
    }

    return (
      ((
        await this._dataSource
          .getRepository(UserProfileEntity)
          .update(userIdFromSessionToken, {
            username: userProfile.username.toString(),
            email: userProfile.email.toString(),
          })
      ).affected ?? 0) > 0
    );
  }

  public async updateUserRole(
    userId: UserId,
    userRole: UserRole,
  ): Promise<boolean> {
    return (
      ((
        await this._dataSource
          .getRepository(UserProfileEntity)
          .update(userId.userId, { role: userRole })
      ).affected ?? 0) > 0
    );
  }

  public async deleteUserProfile(sessionToken: SessionToken): Promise<boolean> {
    const userIdFromSessionToken: number | undefined =
      await this._getUserIdFromSessionToken(sessionToken);

    if (userIdFromSessionToken === undefined) {
      return false;
    }

    return (
      ((
        await this._dataSource
          .getRepository(UserProfileEntity)
          .delete({ userId: userIdFromSessionToken })
      ).affected ?? 0) > 0
    );
  }

  public async deleteUserSession(sessionToken: SessionToken): Promise<boolean> {
    return (
      ((
        await this._dataSource
          .getRepository(UserSessionEntity)
          .delete(sessionToken.toString())
      ).affected ?? 0) > 0
    );
  }

  public isUniqueConstraintViolated(err: unknown): boolean {
    return (
      err instanceof Error &&
      err.message.includes('duplicate key value violates unique constraint')
    );
  }

  private async _getUserIdFromUsername(
    username: Username,
  ): Promise<number | undefined> {
    return (
      await this._dataSource.getRepository(UserProfileEntity).findOne({
        select: { userId: true },
        where: {
          username: username.toString(),
        },
      })
    )?.userId;
  }

  private async _getUserIdFromSessionToken(
    sessionToken: SessionToken,
  ): Promise<number | undefined> {
    return (
      await this._dataSource.getRepository(UserSessionEntity).findOne({
        select: { userId: true },
        where: {
          sessionToken: sessionToken.toString(),
          expireTime: MoreThan(new Date()),
        },
      })
    )?.userId;
  }

  private async _getUserIdFromEmail(
    email: EmailAddress,
  ): Promise<number | undefined> {
    return (
      await this._dataSource.getRepository(UserProfileEntity).findOne({
        select: { userId: true },
        where: {
          email: email.toString(),
        },
      })
    )?.userId;
  }
}
