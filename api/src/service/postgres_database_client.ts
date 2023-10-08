/**
 * @file Defines {@link PostgresDatabaseClient}.
 */
import pg from 'pg';

import EmailAddress from '../data_structs/email_address';
import SessionToken from '../data_structs/session_token';
import ClientModifiableUserProfile from '../data_structs/uncreated_user_profile';
import UserId from '../data_structs/user_id';
import UserIdentity from '../data_structs/user_identity';
import UserProfile from '../data_structs/user_profile';
import Username from '../data_structs/username';
import UserRole, { parseUserRole } from '../enums/user_role';
import DatabaseClient, { DatabaseClientConfig } from './database_client';

export class PostgresDatabaseClient implements DatabaseClient {
  private _pgPool: pg.Pool;

  public constructor(config: DatabaseClientConfig) {
    this._pgPool = new pg.Pool({
      password: config.password,
      user: config.user,
      host: config.host,
      port: config.port,
      database: config.databaseName,
      connectionTimeoutMillis: config.connectionTimeoutMillis,
      idleTimeoutMillis: config.idleTimeoutMillis,
      max: config.maxClientCount,
    });
  }

  public async isUsernameInUse(
    username: Username,
    token?: SessionToken,
  ): Promise<boolean> {
    const result: pg.QueryResult = await this._pgPool.query(
      'SELECT 1 FROM User_Profiles WHERE username=$1 AND user_id NOT IN (' +
        'SELECT user_id FROM User_Sessions WHERE token=$2)',
      [username.toString(), token?.toString()],
    );

    return result.rows.length > 0;
  }

  public async isEmailInUse(
    email: EmailAddress,
    token?: SessionToken,
  ): Promise<boolean> {
    const result: pg.QueryResult = await this._pgPool.query(
      'SELECT 1 FROM User_Profiles WHERE email=$1 AND user_id NOT IN (' +
        'SELECT user_id FROM User_Sessions WHERE token=$2)',
      [email.toString(), token?.toString()],
    );

    return result.rows.length > 0;
  }

  public async fetchPasswordHashFromUsername(
    username: Username,
  ): Promise<string | undefined> {
    const result: pg.QueryResult = await this._pgPool.query(
      'SELECT password_hash FROM User_Credentials WHERE user_id IN (' +
        '  SELECT user_id FROM User_Profiles WHERE username=$1)',
      [username.toString()],
    );

    if (result.rows.length == 0) {
      return undefined;
    }

    return result.rows[0]['password_hash'];
  }

  public async fetchUserProfileFromToken(
    token: SessionToken,
  ): Promise<UserProfile | undefined> {
    const result: pg.QueryResult = await this._pgPool.query(
      'SELECT * FROM User_Profiles WHERE user_id IN (' +
        '  SELECT user_id FROM User_Sessions ' +
        '  WHERE token=$1 AND expire_time > CURRENT_TIMESTAMP)',
      [token.toString()],
    );

    if (result.rows.length == 0) {
      return undefined;
    }

    return {
      userId: UserId.parseNumber(result.rows[0]['user_id']),
      username: Username.parse(result.rows[0]['username']),
      email: EmailAddress.parse(result.rows[0]['email']),
      userRole: parseUserRole(result.rows[0]['role']),
    };
  }

  public async fetchUserIdentityFromToken(
    token: SessionToken,
  ): Promise<UserIdentity | undefined> {
    const result: pg.QueryResult = await this._pgPool.query(
      'SELECT user_id, role FROM User_Profiles WHERE user_id IN (' +
        '  SELECT user_id FROM User_Sessions ' +
        '  WHERE token=$1 AND expire_time > CURRENT_TIMESTAMP)',
      [token.toString()],
    );

    if (result.rows.length == 0) {
      return undefined;
    }

    return {
      userId: UserId.parseNumber(result.rows[0]['user_id']),
      userRole: parseUserRole(result.rows[0]['role']),
    };
  }

  public async createUserProfileAndCredential(
    userProfile: ClientModifiableUserProfile,
    passwordHash: string,
  ): Promise<void> {
    await this._pgPool.query(
      'WITH user_id_cte AS (' +
        '  INSERT INTO User_Profiles (username, email) ' +
        '  VALUES ($1, $2) RETURNING user_id) ' +
        'INSERT INTO User_Credentials SELECT user_id, $3 FROM user_id_cte;',
      [
        userProfile.username.toString(),
        userProfile.email.toString(),
        passwordHash,
      ],
    );
  }

  public async createUserSession(
    token: SessionToken,
    username: Username,
    expireTime: Date,
  ): Promise<void> {
    await this._pgPool.query(
      'INSERT INTO User_Sessions (token, user_id, expire_time) ' +
        '  SELECT $1, user_id, $2 FROM User_Profiles WHERE username=$3',
      [token.toString(), expireTime, username.toString()],
    );
  }

  public async updateUserProfile(
    userProfile: ClientModifiableUserProfile,
    token: SessionToken,
  ): Promise<boolean> {
    const result: pg.QueryResult = await this._pgPool.query(
      'UPDATE User_Profiles SET username=$1, email=$2 WHERE user_id IN (' +
        '  SELECT user_id FROM User_Sessions ' +
        '  WHERE token=$3 AND expire_time > CURRENT_TIMESTAMP)',
      [
        userProfile.username.toString(),
        userProfile.email.toString(),
        token.toString(),
      ],
    );

    return result.rowCount > 0;
  }

  public async updateUserRole(
    userId: UserId,
    userRole: UserRole,
  ): Promise<boolean> {
    const result: pg.QueryResult = await this._pgPool.query(
      'UPDATE User_Profiles SET role=$1 WHERE user_id=$2',
      [userRole.toString(), userId.toString()],
    );

    return result.rowCount > 0;
  }

  public async deleteUserProfile(token: SessionToken): Promise<boolean> {
    const result: pg.QueryResult = await this._pgPool.query(
      'DELETE FROM User_Profiles ' +
        'WHERE user_id IN (SELECT user_id FROM User_Sessions WHERE token=$1)',
      [token.toString()],
    );

    return result.rowCount > 0;
  }

  public async deleteUserSession(token: SessionToken): Promise<boolean> {
    const result: pg.QueryResult = await this._pgPool.query(
      'DELETE FROM User_Sessions WHERE token=$1',
      [token.toString()],
    );

    return result.rowCount > 0;
  }

  public isDuplicateUserProfileUsernameError(err: unknown): boolean {
    return (
      err instanceof Error &&
      err.message.includes(
        'duplicate key value violates unique constraint "user_profiles_username_key"',
      )
    );
  }

  public isDuplicateUserProfileEmailError(err: unknown): boolean {
    return (
      err instanceof Error &&
      err.message.includes(
        'duplicate key value violates unique constraint "user_profiles_email_key"',
      )
    );
  }

  public isDuplicateUserSessionTokenError(err: unknown): boolean {
    return (
      err instanceof Error &&
      err.message.includes(
        'duplicate key value violates unique constraint "user_sessions_pkey"',
      )
    );
  }
}
