/**
 * @file Utility functions for database operations.
 */
import pg from 'pg';

import UserProfile from '../data/user_profile';

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
