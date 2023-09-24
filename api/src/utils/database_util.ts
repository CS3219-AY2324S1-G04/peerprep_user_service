/**
 * @file Utility functions for database operations.
 */
import pg from 'pg';

import UserIdentity from '../data_structs/user_identity';
import UserProfile from '../data_structs/user_profile';
import UserRole from '../enums/user_role';
import { parseUserRole } from './data_parser';

/**
 * Fetches the password hash of the user whose username is {@link username}.
 * @param client - Client for communicating with the database.
 * @param username - Username of the user whose password hash is to be fetched.
 * @returns Password hash of the user if a user with the username
 * {@link username} exist. Else, returns undefined.
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
 * @returns Profile of the user if a user who owns the session token
 * {@link token} exist. Else, returns undefined.
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
    parseUserRole(result.rows[0]['role']),
  );
}

/**
 * Fetches the ID and role of the user who the session token {@link token}
 * belongs to.
 * @param client - Client for communicating with the database.
 * @param token - Session token belonging to the user.
 * @returns ID and role of the user if a user who owns the session token
 * {@link token} exist. Else, returns undefined.
 */
export async function fetchUserIdentityFromToken(
  client: pg.ClientBase,
  token: string,
): Promise<UserIdentity | undefined> {
  const result: pg.QueryResult = await client.query(
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

/**
 * Creates a user profile using information in {@link userProfile} and a user
 * credential using {@link passwordHash}.
 * @param client - Client for communicating with the database.
 * @param userProfile - Information on the user profile.
 * @param passwordHash - Hash of the user's password.
 */
export async function createUserProfileAndCredential(
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
 * Creates a user session for the user with username {@link username}. The
 * session will have a session token {@link token} and will expire at
 * {@link expireTime}.
 * @param client - Client for communicating with the database.
 * @param token - Session token.
 * @param username - Username of the user.
 * @param expireTime - Time of session expiry.
 */
export async function createUserSession(
  client: pg.ClientBase,
  token: string,
  username: string,
  expireTime: Date,
): Promise<void> {
  await client.query(
    'INSERT INTO User_Sessions (token, user_id, expire_time) ' +
      '  SELECT $1, user_id, $2 FROM User_Profiles WHERE username=$3',
    [token, expireTime, username],
  );
}

/**
 * Updates the user profile which belongs to the user who owns the session
 * token {@link token}. The user profile is updated with values in
 * {@link userProfile}.
 * @param client - Client for communicating with the database.
 * @param userProfile - Details of the user's profile.
 * @param token - Session token belonging to the user.
 * @returns True if a user profile was updated. False if no user profile was
 * updated due to the session token {@link token} being an invalid token.
 */
export async function updateUserProfile(
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
 * Updates the user role of the user with username {@link username}. The user
 * role will be updated to {@link userRole}.
 * @param client - Client for communicating with the database.
 * @param username - Username of the user whose role is to be updated.
 * @param userRole - User role to assign.
 * @returns True if a user role was updated. False if no user role was updated
 * due to no user existing with the username {@link username}.
 */
export async function updateUserRole(
  client: pg.ClientBase,
  username: string,
  userRole: UserRole,
): Promise<boolean> {
  const result: pg.QueryResult = await client.query(
    'UPDATE User_Profiles SET role=$1 WHERE username=$2',
    [userRole, username],
  );

  return result.rowCount > 0;
}

/**
 * Deletes the user who owns the session token {@link token}.
 * @param client - Client for communicating with the database.
 * @param token - Session token belonging to the user to be deleted.
 * @returns True if a user was deleted. False if no user was deleted due to
 * the session token {@link token} being an invalid token.
 */
export async function deleteUserProfile(
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
 * Deletes the user session which has the session token {@link token}.
 * @param client - Client for communicating with the database.
 * @param token - Session token of the user session to be deleted.
 * @returns True if a user session was deleted. False if no user session was
 * deleted due to the session token {@link token} being an invalid token.
 */
export async function deleteUserSession(
  client: pg.ClientBase,
  token: string,
): Promise<boolean> {
  const result: pg.QueryResult = await client.query(
    'DELETE FROM User_Sessions WHERE token=$1',
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
