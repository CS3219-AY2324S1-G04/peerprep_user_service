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
    token?: SessionToken,
  ): Promise<boolean> {
    const userProfiles: UserProfileEntity | null = await this._dataSource
      .getRepository(UserProfileEntity)
      .findOne({
        select: { userId: true },
        where: {
          username: username.toString(),
        },
      });

    const userSession: UserSessionEntity | null =
      token === undefined
        ? null
        : await this._dataSource.getRepository(UserSessionEntity).findOne({
            select: { userId: true },
            where: {
              token: token.toString(),
              expireTime: MoreThan(new Date()),
            },
          });

    return userProfiles !== null && userProfiles.userId != userSession?.userId;
  }

  public async isEmailInUse(
    email: EmailAddress,
    token?: SessionToken,
  ): Promise<boolean> {
    const userProfiles: UserProfileEntity | null = await this._dataSource
      .getRepository(UserProfileEntity)
      .findOne({
        select: { userId: true },
        where: {
          email: email.toString(),
        },
      });

    const userSession: UserSessionEntity | null =
      token === undefined
        ? null
        : await this._dataSource.getRepository(UserSessionEntity).findOne({
            select: { userId: true },
            where: {
              token: token.toString(),
              expireTime: MoreThan(new Date()),
            },
          });

    return userProfiles !== null && userProfiles.userId != userSession?.userId;
  }

  public async fetchPasswordHashFromUsername(
    username: Username,
  ): Promise<string | undefined> {
    const userProfile: UserProfileEntity | null = await this._dataSource
      .getRepository(UserProfileEntity)
      .findOne({
        select: { userId: true },
        where: {
          username: username.toString(),
        },
      });

    return userProfile === null
      ? undefined
      : (
          await this._dataSource.getRepository(UserCredentialEntity).findOne({
            select: { passwordHash: true },
            where: { userId: userProfile.userId },
          })
        )?.passwordHash;
  }

  public async fetchUserProfileFromToken(
    token: SessionToken,
  ): Promise<UserProfile | undefined> {
    const userSession: UserSessionEntity | null = await this._dataSource
      .getRepository(UserSessionEntity)
      .findOne({
        select: { userId: true },
        where: { token: token.toString(), expireTime: MoreThan(new Date()) },
      });

    const userProfile: UserProfileEntity | null =
      userSession === null
        ? null
        : await this._dataSource
            .getRepository(UserProfileEntity)
            .findOneBy({ userId: userSession.userId });

    if (userProfile === null) {
      return undefined;
    }

    return {
      userId: UserId.parseNumber(userProfile.userId),
      username: Username.parse(userProfile.username),
      email: EmailAddress.parse(userProfile.email),
      userRole: parseUserRole(userProfile.role),
    };
  }

  public async fetchUserIdentityFromToken(
    token: SessionToken,
  ): Promise<UserIdentity | undefined> {
    const userProfile: UserProfile | undefined =
      await this.fetchUserProfileFromToken(token);

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
    token: SessionToken,
    username: Username,
    expireTime: Date,
  ): Promise<void> {
    const userProfile: UserProfileEntity = await this._dataSource
      .getRepository(UserProfileEntity)
      .findOneByOrFail({ username: username.toString() });

    await this._dataSource.getRepository(UserSessionEntity).insert({
      token: token.toString(),
      userId: userProfile.userId,
      expireTime: expireTime,
    });
  }

  public async updateUserProfile(
    userProfile: ClientModifiableUserProfile,
    token: SessionToken,
  ): Promise<boolean> {
    const userSession: UserSessionEntity | null = await this._dataSource
      .getRepository(UserSessionEntity)
      .findOneBy({
        token: token.toString(),
        expireTime: MoreThan(new Date()),
      });

    if (userSession === null) {
      return false;
    }

    return (
      ((
        await this._dataSource
          .getRepository(UserProfileEntity)
          .update(userSession.userId, {
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

  public async deleteUserProfile(token: SessionToken): Promise<boolean> {
    const userSession: UserSessionEntity | null = await this._dataSource
      .getRepository(UserSessionEntity)
      .findOneBy({ token: token.toString(), expireTime: MoreThan(new Date()) });

    return (
      ((
        await this._dataSource
          .getRepository(UserProfileEntity)
          .delete({ userId: userSession?.userId })
      ).affected ?? 0) > 0
    );
  }

  public async deleteUserSession(token: SessionToken): Promise<boolean> {
    return (
      ((
        await this._dataSource
          .getRepository(UserSessionEntity)
          .delete(token.toString())
      ).affected ?? 0) > 0
    );
  }

  public isUniqueConstraintViolated(err: unknown): boolean {
    return (
      err instanceof Error &&
      err.message.includes('duplicate key value violates unique constraint')
    );
  }
}
