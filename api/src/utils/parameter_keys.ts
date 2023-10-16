/**
 * @file Keys for query parameter, path parameter, and cookie.
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
/** Session token key. */
export const sessionTokenKey: string = 'session-token';

// This is needed as express does not allow path parameters with hyphens
/** User ID key for path parameter. */
export const userIdPathKey: string = 'userId';

export default {
  usernameParam: usernameKey,
  emailAddressParam: emailAddressKey,
  userIdParam: userIdKey,
  userRoleParam: userRoleKey,
  sessionTokenParam: sessionTokenKey,
  userIdPathParam: userIdPathKey,
};
