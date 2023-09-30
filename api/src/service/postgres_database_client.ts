/**
 * @file Defines {@link PostgresDatabaseClient}.
 */
import pg from 'pg';

import UserIdentity from '../data_structs/user_identity';
import UserProfile from '../data_structs/user_profile';
import UserRole from '../enums/user_role';
import { parseUserRole } from '../utils/data_parser';
import DatabaseClient from './database_client';

export class PostgresDatabaseClient implements DatabaseClient {
  private _pgPool: pg.Pool;

  public constructor(config: pg.PoolConfig) {
    this._pgPool = new pg.Pool(config);
  }

  public async fetchPasswordHashFromUsername(
    username: string,
  ): Promise<string | undefined> {
    const result: pg.QueryResult = await this._pgPool.query(
      'SELECT password_hash FROM User_Credentials WHERE user_id IN (' +
        '  SELECT user_id FROM User_Profiles WHERE username=$1)',
      [username],
    );

    if (result.rows.length == 0) {
      return undefined;
    }

    return result.rows[0]['password_hash'];
  }

  public async fetchUserProfileFromToken(
    token: string,
  ): Promise<UserProfile | undefined> {
    const result: pg.QueryResult = await this._pgPool.query(
      'SELECT * FROM User_Profiles WHERE user_id IN (' +
        '  SELECT user_id FROM User_Sessions ' +
        '  WHERE token=$1 AND expire_time > CURRENT_TIMESTAMP)',
      [token],
    );

    if (result.rows.length == 0) {
      return undefined;
    }

    return new UserProfile(
      result.rows[0]['user_id'],
      result.rows[0]['username'],
      result.rows[0]['email'],
      parseUserRole(result.rows[0]['role']),
    );
  }

  public async fetchUserIdentityFromToken(
    token: string,
  ): Promise<UserIdentity | undefined> {
    const result: pg.QueryResult = await this._pgPool.query(
      'SELECT user_id, role FROM User_Profiles WHERE user_id IN (' +
        '  SELECT user_id FROM User_Sessions ' +
        '  WHERE token=$1 AND expire_time > CURRENT_TIMESTAMP)',
      [token],
    );

    if (result.rows.length == 0) {
      return undefined;
    }

    return new UserIdentity(
      result.rows[0]['user_id'],
      parseUserRole(result.rows[0]['role']),
    );
  }

  public async createUserProfileAndCredential(
    userProfile: UserProfile,
    passwordHash: string,
  ): Promise<void> {
    await this._pgPool.query(
      'WITH user_id_cte AS (' +
        '  INSERT INTO User_Profiles (username, email) ' +
        '  VALUES ($1, $2) RETURNING user_id) ' +
        'INSERT INTO User_Credentials SELECT user_id, $3 FROM user_id_cte;',
      [userProfile.username, userProfile.email, passwordHash],
    );
  }

  public async createUserSession(
    token: string,
    username: string,
    expireTime: Date,
  ): Promise<void> {
    await this._pgPool.query(
      'INSERT INTO User_Sessions (token, user_id, expire_time) ' +
        '  SELECT $1, user_id, $2 FROM User_Profiles WHERE username=$3',
      [token, expireTime, username],
    );
  }

  public async updateUserProfile(
    userProfile: UserProfile,
    token: string,
  ): Promise<boolean> {
    const result: pg.QueryResult = await this._pgPool.query(
      'UPDATE User_Profiles SET username=$1, email=$2 WHERE user_id IN (' +
        '  SELECT user_id FROM User_Sessions ' +
        '  WHERE token=$3 AND expire_time > CURRENT_TIMESTAMP)',
      [userProfile.username, userProfile.email, token],
    );

    return result.rowCount > 0;
  }

  public async updateUserRole(
    username: string,
    userRole: UserRole,
  ): Promise<boolean> {
    const result: pg.QueryResult = await this._pgPool.query(
      'UPDATE User_Profiles SET role=$1 WHERE username=$2',
      [userRole, username],
    );

    return result.rowCount > 0;
  }

  public async deleteUserProfile(token: string): Promise<boolean> {
    const result: pg.QueryResult = await this._pgPool.query(
      'DELETE FROM User_Profiles ' +
        'WHERE user_id IN (SELECT user_id FROM User_Sessions WHERE token=$1)',
      [token],
    );

    return result.rowCount > 0;
  }

  public async deleteUserSession(token: string): Promise<boolean> {
    const result: pg.QueryResult = await this._pgPool.query(
      'DELETE FROM User_Sessions WHERE token=$1',
      [token],
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
