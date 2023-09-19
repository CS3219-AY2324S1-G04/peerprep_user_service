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
 * Fetches the user profile of the user who the session token {@link token}
 * belongs to.
 * @param client - Client for communicating with the database.
 * @param token - Session token belonging to the user.
 * @returns Profile of the user if a user who owns the session token exist.
 * Else, returns undefined.
 */
export async function fetchUserProfileFromToken(
  client: pg.ClientBase,
  token: string,
): Promise<UserProfile | undefined> {
  const result: pg.QueryResult = await client.query(
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
    result.rows[0]['role'],
  );
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
 * Updates the entry for the user profile which belongs to the user who owns
 * the session token {@link token}.
 * @param client - Client for communicating with the database.
 * @param userProfile - Details of the user's profile.
 * @param token - Session token belonging to the user.
 * @returns True if the entry was updated. False if no entry is updated due to
 * the session token {@link token} being an invalid token.
 */
export async function updateUserProfileEntry(
  client: pg.ClientBase,
  userProfile: UserProfile,
  token: string,
): Promise<boolean> {
  const result: pg.QueryResult = await client.query(
    'UPDATE User_Profiles SET username=$1, email=$2 WHERE user_id IN (' +
      '  SELECT user_id FROM User_Sessions ' +
      '  WHERE token=$3 AND expire_time > CURRENT_TIMESTAMP)',
    [userProfile.username, userProfile.email, token],
  );

  return result.rowCount > 0;
}

/**
 * Deletes the entry for the user profile which belongs to the user who owns
 * the session token {@link token}.
 * @param client - Client for communicating with the database.
 * @param token - Session token belonging to the user.
 * @returns True if the entry was deleted. False if no entry is deleted due to
 * the session token {@link token} being an invalid token.
 */
export async function deleteUserProfileEntry(
  client: pg.ClientBase,
  token: string,
): Promise<boolean> {
  const result: pg.QueryResult = await client.query(
    'DELETE FROM User_Profiles ' +
      'WHERE user_id IN (SELECT user_id FROM User_Sessions WHERE token=$1)',
    [token],
  );

  return result.rowCount > 0;
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
