/**
 * @file Defines {@link DatabaseClient}.
 */
import EmailAddress from '../data_structs/email_address';
import SessionToken from '../data_structs/session_token';
import ClientModifiableUserProfile from '../data_structs/uncreated_user_profile';
import UserId from '../data_structs/user_id';
import UserIdentity from '../data_structs/user_identity';
import UserProfile from '../data_structs/user_profile';
import Username from '../data_structs/username';
import UserRole from '../enums/user_role';

/** Client for performing database operations. */
export default interface DatabaseClient {
  /** Initialise the client. */
  initialise(): Promise<void>;

  /**
   * Checks if username {@link username} is already in use.
   * @param username - Username to check.
   * @param sessionToken - Session token whose corresponding user's username is
   * ignored in the check.
   * @returns True if the username is in use. Else, returns false.
   */
  isUsernameInUse(
    username: Username,
    sessionToken?: SessionToken,
  ): Promise<boolean>;

  /**
   * Checks if email address {@link emailAddress} is already in use.
   * @param emailAddress - Email address to check.
   * @param sessionToken - Session token whose corresponding user's email
   * address is ignored in the check.
   * @returns True if the email address is in use. Else, returns false.
   */
  isEmailAddressInUse(
    emailAddress: EmailAddress,
    sessionToken?: SessionToken,
  ): Promise<boolean>;

  /**
   * Fetches the password hash of the user whose username is {@link username}.
   * @param username - Username of the user whose password hash is to be
   * fetched.
   * @returns Password hash of the user if a user with the username
   * {@link username} exist. Else, returns undefined.
   */
  fetchPasswordHashFromUsername(
    username: Username,
  ): Promise<string | undefined>;

  /**
   * Fetches the password hash of the user who owns the session token
   * {@link sessionToken}.
   * @param sessionToken - Session token belonging to the user.
   * @returns Password hash of the user if a user who owns the session token
   * {@link sessionToken} exist. Else, returns undefined.
   */
  fetchPasswordHashFromSessionToken(
    sessionToken: SessionToken,
  ): Promise<string | undefined>;

  /**
   * Fetches the user profile of the user who the session token
   * {@link sessionToken} belongs to.
   * @param sessionToken - Session token belonging to the user.
   * @returns Profile of the user if a user who owns the session token
   * {@link sessionToken} exist. Else, returns undefined.
   */
  fetchUserProfileFromSessionToken(
    sessionToken: SessionToken,
  ): Promise<UserProfile | undefined>;

  /**
   * Fetches the user ID and user role of the user who the session token
   * {@link sessionToken} belongs to.
   * @param sessionToken - Session token belonging to the user.
   * @returns User ID and user role of the user if a user who owns the session
   * token {@link sessionToken} exist. Else, returns undefined.
   */
  fetchUserIdentityFromSessionToken(
    sessionToken: SessionToken,
  ): Promise<UserIdentity | undefined>;

  /**
   * Creates a user profile using information in {@link userProfile} and a user
   * credential using {@link passwordHash}.
   * @param userProfile - Information on the user profile.
   * @param passwordHash - Hash of the user's password.
   */
  createUserProfileAndCredential(
    userProfile: ClientModifiableUserProfile,
    passwordHash: string,
  ): Promise<void>;

  /**
   * Creates a user session for the user with username {@link username}. The
   * session will have a session token {@link sessionToken} and will expire at
   * {@link sessionExpiry}.
   * @param sessionToken - Session token.
   * @param username - Username of the user.
   * @param sessionExpiry - Time of session expiry.
   */
  createUserSession(
    sessionToken: SessionToken,
    username: Username,
    sessionExpiry: Date,
  ): Promise<void>;

  /**
   * Updates the user profile which belongs to the user who owns the session
   * token {@link sessionToken}. The user profile is updated with values in
   * {@link userProfile}.
   * @param userProfile - Updated information on the user's profile.
   * @param sessionToken - Session token belonging to the user.
   * @returns True if a user profile was updated. False if no user profile was
   * updated due to the session token {@link sessionToken} being an invalid
   * token.
   */
  updateUserProfile(
    userProfile: ClientModifiableUserProfile,
    sessionToken: SessionToken,
  ): Promise<boolean>;

  /**
   * Updates the user role of the user with username {@link userId}. The user
   * role will be updated to {@link userRole}.
   * @param userId - User ID of the user whose user role is to be updated.
   * @param userRole - User role to assign.
   * @returns True if a user role was updated. False if no user role was updated
   * due to no user existing with the username {@link userId}.
   */
  updateUserRole(userId: UserId, userRole: UserRole): Promise<boolean>;

  /**
   * Deletes the user who owns the session token {@link sessionToken}.
   * @param sessionToken - Session token belonging to the user to be deleted.
   * @returns True if a user was deleted. False if no user was deleted due to
   * the session token {@link sessionToken} being an invalid token.
   */
  deleteUserProfile(sessionToken: SessionToken): Promise<boolean>;
  /**
   * Deletes the user session which has the session token {@link sessionToken}.
   * @param sessionToken - Session token of the user session to be deleted.
   * @returns True if a user session was deleted. False if no user session was
   * deleted due to the session token {@link sessionToken} being an invalid
   * token.
   */
  deleteUserSession(sessionToken: SessionToken): Promise<boolean>;

  /**
   * @param err - The error to check.
   * @returns True if {@link err} is an {@link Error} caused by a violation of
   * a unique constraint.
   */
  isUniqueConstraintViolated(err: unknown): boolean;
}

/** Configs for {@link DatabaseClient}. */
export interface DatabaseClientConfig {
  /** Password of the database. */
  password: string;
  /** User on the database host. */
  user: string;
  /** Address of the database host. */
  host: string;
  /** Port of the database host that the DBMS is listening on. */
  port: number;
  /** Name of the database. */
  databaseName: string;
  /**
   * Number of milliseconds for a client to connect to the database before
   * timing out.
   */
  connectionTimeoutMillis: number;
  /**
   * Number of milliseconds a client can remain idle for before being
   * disconnected.
   */
  idleTimeoutMillis: number;
  /** Max number of concurrent clients. */
  maxClientCount: number;
}
