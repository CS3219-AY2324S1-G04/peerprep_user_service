/**
 * @file Utility functions for database operations.
 */
import pg from 'pg';

import UserProfile from '../data/user_profile';

/**
 * Fetches the password hash of the user whose username is {@link username}.
 * @param client - Client for communicating with the database.
 * @param username - Username of the user.
 * @returns Password hash of the user if a user with the username exist. Else,
 * returns undefined.
 */
export async function fetchPasswordHashFromUsername(
  client: pg.ClientBase,
  username: string,
): Promise<string | undefined> {
  const result: pg.QueryResult = await client.query(
    'SELECT password_hash FROM User_Credentials WHERE user_id IN (' +
      '  SELECT user_id FROM User_Profiles WHERE username=$1)',
    [username],
  );

  if (result.rows.length == 0) {
    return undefined;
  }

  return result.rows[0]['password_hash'];
}

/**
 * Creates an entry in the database for a user profile and another entry for a
 * user credential corresponding to the user profile.
 * @param client - Client for communicating with the database.
 * @param userProfile - Details of the user profile.
 * @param passwordHash - Hash of the user's password.
 */
export async function createUserProfileAndCredentialEntry(
  client: pg.ClientBase,
  userProfile: UserProfile,
  passwordHash: string,
) {
  await client.query(
    'WITH user_id_cte AS (' +
      '  INSERT INTO User_Profiles (username, email) ' +
      '  VALUES ($1, $2) RETURNING user_id) ' +
      'INSERT INTO User_Credentials SELECT user_id, $3 FROM user_id_cte;',
    [userProfile.username, userProfile.email, passwordHash],
  );
}

/**
 * Creates an entry in the database for a user session.
 * @param client - Client for communicating with the database.
 * @param token - Session token.
 * @param username - Username of the user.
 * @param loginTime - Time of session creation.
 * @param expireTime - Time of session expiry.
 */
export async function createUserSessionEntry(
  client: pg.ClientBase,
  token: string,
  username: string,
  loginTime: Date,
  expireTime: Date,
): Promise<void> {
  await client.query(
    'INSERT INTO User_Sessions (token, user_id, expire_time) ' +
      '  SELECT $1, user_id, $2 FROM User_Profiles WHERE username=$3',
    [token, expireTime, username],
  );
}

/**
 * @param err - The error to check.
 * @returns True if {@link err} is an {@link Error} caused by a duplicated user
 * profile username in the user_profiles database relation.
 */
export function isDuplicateUserProfileUsernameError(err: unknown): boolean {
  return (
    err instanceof Error &&
    err.message.includes(
      'duplicate key value violates unique constraint "user_profiles_username_key"',
    )
  );
}

/**
 * @param err - The error to check.
 * @returns True if {@link err} is an {@link Error} caused by a duplicated user
 * profile email in the user_profiles database relation.
 */
export function isDuplicateUserProfileEmailError(err: unknown): boolean {
  return (
    err instanceof Error &&
    err.message.includes(
      'duplicate key value violates unique constraint "user_profiles_email_key"',
    )
  );
}

/**
 * @param err - The error to check.
 * @returns True if {@link err} is an {@link Error} caused by a duplicated
 * session token in the user_sessions database relation.
 */
export function isDuplicateUserSessionTokenError(err: unknown): boolean {
  return (
    err instanceof Error &&
    err.message.includes(
      'duplicate key value violates unique constraint "user_sessions_pkey"',
    )
  );
}
