/**
 * @file Defines {@link DatabaseClient}.
 */
import UserIdentity from '../data_structs/user_identity';
import UserProfile from '../data_structs/user_profile';
import UserRole from '../enums/user_role';

/** Represents the database storing the user information. */
export default interface DatabaseClient {
  /**
   * Fetches the password hash of the user whose username is {@link username}.
   * @param username - Username of the user whose password hash is to be
   * fetched.
   * @returns Password hash of the user if a user with the username
   * {@link username} exist. Else, returns undefined.
   */
  fetchPasswordHashFromUsername(username: string): Promise<string | undefined>;

  /**
   * Fetches the user profile of the user who the session token {@link token}
   * belongs to.
   * @param token - Session token belonging to the user.
   * @returns Profile of the user if a user who owns the session token
   * {@link token} exist. Else, returns undefined.
   */
  fetchUserProfileFromToken(token: string): Promise<UserProfile | undefined>;

  /**
   * Fetches the ID and role of the user who the session token {@link token}
   * belongs to.
   * @param token - Session token belonging to the user.
   * @returns ID and role of the user if a user who owns the session token
   * {@link token} exist. Else, returns undefined.
   */
  fetchUserIdentityFromToken(token: string): Promise<UserIdentity | undefined>;

  /**
   * Creates a user profile using information in {@link userProfile} and a user
   * credential using {@link passwordHash}.
   * @param userProfile - Information on the user profile.
   * @param passwordHash - Hash of the user's password.
   */
  createUserProfileAndCredential(
    userProfile: UserProfile,
    passwordHash: string,
  ): Promise<void>;

  /**
   * Creates a user session for the user with username {@link username}. The
   * session will have a session token {@link token} and will expire at
   * {@link expireTime}.
   * @param token - Session token.
   * @param username - Username of the user.
   * @param expireTime - Time of session expiry.
   */
  createUserSession(
    token: string,
    username: string,
    expireTime: Date,
  ): Promise<void>;

  /**
   * Updates the user profile which belongs to the user who owns the session
   * token {@link token}. The user profile is updated with values in
   * {@link userProfile}.
   * @param userProfile - Details of the user's profile.
   * @param token - Session token belonging to the user.
   * @returns True if a user profile was updated. False if no user profile was
   * updated due to the session token {@link token} being an invalid token.
   */
  updateUserProfile(userProfile: UserProfile, token: string): Promise<boolean>;

  /**
   * Updates the user role of the user with username {@link userId}. The user
   * role will be updated to {@link userRole}.
   * @param userId - ID of the user whose role is to be updated.
   * @param userRole - User role to assign.
   * @returns True if a user role was updated. False if no user role was updated
   * due to no user existing with the username {@link userId}.
   */
  updateUserRole(userId: number, userRole: UserRole): Promise<boolean>;

  /**
   * Deletes the user who owns the session token {@link token}.
   * @param token - Session token belonging to the user to be deleted.
   * @returns True if a user was deleted. False if no user was deleted due to
   * the session token {@link token} being an invalid token.
   */
  deleteUserProfile(token: string): Promise<boolean>;
  /**
   * Deletes the user session which has the session token {@link token}.
   * @param token - Session token of the user session to be deleted.
   * @returns True if a user session was deleted. False if no user session was
   * deleted due to the session token {@link token} being an invalid token.
   */
  deleteUserSession(token: string): Promise<boolean>;

  /**
   * @param err - The error to check.
   * @returns True if {@link err} is an {@link Error} caused by a duplicated
   * user profile username in the user_profiles database relation.
   */
  isDuplicateUserProfileUsernameError(err: unknown): boolean;

  /**
   * @param err - The error to check.
   * @returns True if {@link err} is an {@link Error} caused by a duplicated
   * user profile email in the user_profiles database relation.
   */
  isDuplicateUserProfileEmailError(err: unknown): boolean;

  /**
   * @param err - The error to check.
   * @returns True if {@link err} is an {@link Error} caused by a duplicated
   * session token in the user_sessions database relation.
   */
  isDuplicateUserSessionTokenError(err: unknown): boolean;
}
