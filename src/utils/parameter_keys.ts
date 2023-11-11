/**
 * @file Keys for query parameters, path parameters, and cookies.
 */

/** Username key. */
export const usernameKey: string = 'username';
/** Email address key. */
export const emailAddressKey: string = 'email-address';
/** User ID key. */
export const userIdKey: string = 'user-id';
/** User role key. */
export const userRoleKey: string = 'user-role';
/** Password key. */
export const passwordKey: string = 'password';
/** New password key. */
export const newPasswordKey: string = 'new-password';
/** Session token key. */
export const sessionTokenKey: string = 'session-token';
/** Access token key. */
export const accessTokenKey: string = 'access-token';
/** Access token expiry key. */
export const accessTokenExpiryKey: string = 'access-token-expiry';

// This is needed as express does not allow path parameters with hyphens
/** User ID key for path parameters. */
export const userIdPathKey: string = 'userId';

export default {
  usernameKey,
  emailAddressKey,
  userIdKey,
  userRoleKey,
  passwordKey,
  newPasswordKey,
  sessionTokenKey,
  accessTokenKey,
  accessTokenExpiryKey,
  userIdPathKey,
};
