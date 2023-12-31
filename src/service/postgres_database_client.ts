/**
 * @file Defines {@link PostgresDatabaseClient}.
 */
import { DataSource, In, MoreThan } from 'typeorm';

import DatabaseClientConfig from '../configs/database_client_config';
import ClientModifiableUserProfile from '../data_structs/client_modifiable_user_profile';
import EmailAddress from '../data_structs/email_address';
import PasswordHash from '../data_structs/password_hash';
import SessionToken from '../data_structs/session_token';
import UserId from '../data_structs/user_id';
import UserIdentity from '../data_structs/user_identity';
import UserProfile from '../data_structs/user_profile';
import Username from '../data_structs/username';
import UserCredentialEntity from '../entities/user_credential';
import UserProfileEntity from '../entities/user_profile';
import UserSessionEntity from '../entities/user_session';
import UserRole, { parseUserRole } from '../enums/user_role';
import DatabaseClient from './database_client';

/** Client for performing database operations on a Postgres database. */
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
      ssl: config.shouldUseTls,
    });
  }

  /** @inheritdoc */
  public async initialise(): Promise<void> {
    await this._dataSource.initialize();
  }

  /** @inheritdoc */
  public async synchronise(): Promise<void> {
    await this._dataSource.synchronize();
  }

  /** @inheritdoc */
  public async disconnect(): Promise<void> {
    await this._dataSource.destroy();
  }

  /** @inheritdoc */
  public async doEntitiesExist(): Promise<boolean> {
    return (
      (
        await this._dataSource.query(
          'SELECT 1 FROM information_schema.tables WHERE table_name IN ($1, $2, $3)',
          [
            this._dataSource.getRepository(UserSessionEntity).metadata
              .tableName,
            this._dataSource.getRepository(UserCredentialEntity).metadata
              .tableName,
            this._dataSource.getRepository(UserProfileEntity).metadata
              .tableName,
          ],
        )
      ).length > 0
    );
  }

  /** @inheritdoc */
  public async deleteEntities(): Promise<void> {
    const userSessionEntityName: string =
      this._dataSource.getRepository(UserSessionEntity).metadata.tableName;
    const userCredentialEntityName: string =
      this._dataSource.getRepository(UserCredentialEntity).metadata.tableName;
    const userProfileEntityName: string =
      this._dataSource.getRepository(UserProfileEntity).metadata.tableName;

    await this._dataSource.query(
      `DROP TABLE IF EXISTS ${userSessionEntityName}, ${userCredentialEntityName}, ${userProfileEntityName}`,
    );
  }

  /** @inheritdoc */
  public async isUsernameInUse(
    username: Username,
    sessionToken?: SessionToken,
  ): Promise<boolean> {
    const userIdFromUsername: UserId | undefined =
      await this._fetchUserIdFromUsername(username);

    if (userIdFromUsername === undefined) {
      return false;
    }

    const userIdFromSessionToken: UserId | undefined =
      sessionToken === undefined
        ? undefined
        : await this._fetchUserIdFromSessionToken(sessionToken);

    return (
      userIdFromUsername?.toNumber() !== userIdFromSessionToken?.toNumber()
    );
  }

  /** @inheritdoc */
  public async isEmailAddressInUse(
    emailAddress: EmailAddress,
    sessionToken?: SessionToken,
  ): Promise<boolean> {
    const userIdFromEmailAddress: UserId | undefined =
      await this._fetchUserIdFromEmailAddress(emailAddress);

    if (userIdFromEmailAddress === undefined) {
      return false;
    }

    const userIdFromSessionToken: UserId | undefined =
      sessionToken === undefined
        ? undefined
        : await this._fetchUserIdFromSessionToken(sessionToken);

    return (
      userIdFromEmailAddress?.toNumber() !== userIdFromSessionToken?.toNumber()
    );
  }

  /** @inheritdoc */
  public async fetchUsernamesFromUserIds(
    userIds: UserId[],
  ): Promise<{ userId: UserId; username: Username }[]> {
    const userProfiles: UserProfileEntity[] = await this._dataSource
      .getRepository(UserProfileEntity)
      .find({
        select: { userId: true, username: true },
        where: {
          userId: In(userIds.map((userId) => userId.toNumber())),
        },
      });

    return userProfiles.map((userProfile) => {
      return {
        userId: UserId.parseNumber(userProfile.userId),
        username: Username.parse(userProfile.username),
      };
    });
  }

  /** @inheritdoc */
  public async fetchPasswordHashFromUsername(
    username: Username,
  ): Promise<PasswordHash | undefined> {
    const userId: UserId | undefined =
      await this._fetchUserIdFromUsername(username);

    if (userId === undefined) {
      return undefined;
    }

    return await this._fetchPasswordHashFromUserId(userId);
  }

  /** @inheritdoc */
  public async fetchPasswordHashFromSessionToken(
    sessionToken: SessionToken,
  ): Promise<PasswordHash | undefined> {
    const userId: UserId | undefined =
      await this._fetchUserIdFromSessionToken(sessionToken);

    if (userId === undefined) {
      return undefined;
    }

    return this._fetchPasswordHashFromUserId(userId);
  }

  /** @inheritdoc */
  public async fetchUserProfileFromSessionToken(
    sessionToken: SessionToken,
  ): Promise<UserProfile | undefined> {
    const userId: UserId | undefined =
      await this._fetchUserIdFromSessionToken(sessionToken);

    if (userId === undefined) {
      return undefined;
    }

    const userProfile: UserProfileEntity | undefined =
      (await this._dataSource
        .getRepository(UserProfileEntity)
        .findOneBy({ userId: userId.toNumber() })) ?? undefined;

    if (userProfile === undefined) {
      return undefined;
    }

    return {
      userId: UserId.parseNumber(userProfile.userId),
      username: Username.parse(userProfile.username),
      emailAddress: EmailAddress.parse(userProfile.emailAddress),
      userRole: parseUserRole(userProfile.userRole),
    };
  }

  /** @inheritdoc */
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

  /** @inheritdoc */
  public async createUserProfileAndCredential(
    userProfile: ClientModifiableUserProfile,
    passwordHash: PasswordHash,
  ): Promise<void> {
    const result = await this._dataSource
      .getRepository(UserProfileEntity)
      .insert({
        username: userProfile.username.toString(),
        emailAddress: userProfile.emailAddress.toString(),
      });

    await this._dataSource.getRepository(UserCredentialEntity).insert({
      userId: result.identifiers[0].userId,
      passwordHash: passwordHash.toString(),
    });
  }

  /** @inheritdoc */
  public async createUserSession(
    sessionToken: SessionToken,
    username: Username,
    sessionExpiry: Date,
  ): Promise<void> {
    const userId: number = (
      await this._dataSource.getRepository(UserProfileEntity).findOneOrFail({
        select: { userId: true },
        where: { username: username.toString() },
      })
    ).userId;

    await this._dataSource.getRepository(UserSessionEntity).insert({
      sessionToken: sessionToken.toString(),
      userId: userId,
      sessionExpiry: sessionExpiry,
    });
  }

  /** @inheritdoc */
  public async updateUserProfile(
    userProfile: ClientModifiableUserProfile,
    sessionToken: SessionToken,
  ): Promise<boolean> {
    const userId: UserId | undefined =
      await this._fetchUserIdFromSessionToken(sessionToken);

    if (userId === undefined) {
      return false;
    }

    return (
      ((
        await this._dataSource
          .getRepository(UserProfileEntity)
          .update(userId.toNumber(), {
            username: userProfile.username.toString(),
            emailAddress: userProfile.emailAddress.toString(),
          })
      ).affected ?? 0) > 0
    );
  }

  /** @inheritdoc */
  public async updatePasswordHash(
    passwordHash: PasswordHash,
    sessionToken: SessionToken,
  ): Promise<boolean> {
    const userId: UserId | undefined =
      await this._fetchUserIdFromSessionToken(sessionToken);

    if (userId === undefined) {
      return false;
    }

    return (
      ((
        await this._dataSource
          .getRepository(UserCredentialEntity)
          .update(userId.toNumber(), {
            passwordHash: passwordHash.toString(),
          })
      ).affected ?? 0) > 0
    );
  }

  /** @inheritdoc */
  public async updateUserRole(
    userId: UserId,
    userRole: UserRole,
  ): Promise<boolean> {
    return (
      ((
        await this._dataSource
          .getRepository(UserProfileEntity)
          .update(userId.toNumber(), { userRole: userRole })
      ).affected ?? 0) > 0
    );
  }

  /** @inheritdoc */
  public async updateUserSessionExpiry(
    sessionToken: SessionToken,
    sessionExpiry: Date,
  ): Promise<boolean> {
    return (
      ((
        await this._dataSource
          .getRepository(UserSessionEntity)
          .update(sessionToken.toString(), { sessionExpiry: sessionExpiry })
      ).affected ?? 0) > 0
    );
  }

  /** @inheritdoc */
  public async deleteUserProfile(sessionToken: SessionToken): Promise<boolean> {
    const userId: UserId | undefined =
      await this._fetchUserIdFromSessionToken(sessionToken);

    if (userId === undefined) {
      return false;
    }

    return (
      ((
        await this._dataSource
          .getRepository(UserProfileEntity)
          .delete({ userId: userId.toNumber() })
      ).affected ?? 0) > 0
    );
  }

  /** @inheritdoc */
  public async deleteUserSession(sessionToken: SessionToken): Promise<boolean> {
    return (
      ((
        await this._dataSource
          .getRepository(UserSessionEntity)
          .delete(sessionToken.toString())
      ).affected ?? 0) > 0
    );
  }

  /** @inheritdoc */
  public isUniqueConstraintViolated(err: unknown): boolean {
    return (
      err instanceof Error &&
      err.message.includes('duplicate key value violates unique constraint')
    );
  }

  private async _fetchUserIdFromUsername(
    username: Username,
  ): Promise<UserId | undefined> {
    const userId: number | undefined = (
      await this._dataSource.getRepository(UserProfileEntity).findOne({
        select: { userId: true },
        where: {
          username: username.toString(),
        },
      })
    )?.userId;

    return userId === undefined ? undefined : UserId.parseNumber(userId);
  }

  private async _fetchUserIdFromSessionToken(
    sessionToken: SessionToken,
  ): Promise<UserId | undefined> {
    const userId: number | undefined = (
      await this._dataSource.getRepository(UserSessionEntity).findOne({
        select: { userId: true },
        where: {
          sessionToken: sessionToken.toString(),
          sessionExpiry: MoreThan(new Date()),
        },
      })
    )?.userId;

    return userId === undefined ? undefined : UserId.parseNumber(userId);
  }

  private async _fetchUserIdFromEmailAddress(
    emailAddress: EmailAddress,
  ): Promise<UserId | undefined> {
    const userId: number | undefined = (
      await this._dataSource.getRepository(UserProfileEntity).findOne({
        select: { userId: true },
        where: {
          emailAddress: emailAddress.toString(),
        },
      })
    )?.userId;

    return userId === undefined ? undefined : UserId.parseNumber(userId);
  }

  private async _fetchPasswordHashFromUserId(
    userId: UserId,
  ): Promise<PasswordHash | undefined> {
    const passwordHash: string | undefined = (
      await this._dataSource.getRepository(UserCredentialEntity).findOne({
        select: { passwordHash: true },
        where: { userId: userId.toNumber() },
      })
    )?.passwordHash;

    return passwordHash === undefined
      ? undefined
      : new PasswordHash(passwordHash);
  }
}
