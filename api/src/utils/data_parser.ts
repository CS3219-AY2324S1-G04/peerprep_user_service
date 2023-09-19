/**
 * @file Utility functions for parsing user inputs.
 */
import qs from 'qs';

/**
 * Parses {@link username} as a username and check it's validity.
 * @param username - The username to check.
 * @returns The parsed username.
 * @throws Error when username is empty or not a string.
 */
export function parseUsername(
  username: string | qs.ParsedQs | string[] | qs.ParsedQs[] | undefined,
): string {
  if (
    username === undefined ||
    (typeof username === 'string' && username.length == 0)
  ) {
    throw new Error('Username was not specified.');
  }

  if (typeof username !== 'string') {
    throw new Error('Username is of the wrong type.');
  }

  // TODO: Limit username length

  return username;
}

/**
 * Parses {@link email} as an email and check it's validity.
 * @param email - The email to check.
 * @returns The parsed email in lowercase.
 * @throws Error when email is empty or not a string.
 */
export function parseEmail(
  email: string | qs.ParsedQs | string[] | qs.ParsedQs[] | undefined,
): string {
  if (email === undefined || (typeof email === 'string' && email.length == 0)) {
    throw new Error('Email was not specified.');
  }

  if (typeof email !== 'string') {
    throw new Error('Email is of the wrong type.');
  }

  // TODO: Validate email regex
  // TODO: Limit email length

  return email.toLowerCase();
}

/**
 * Parses {@link password} as a password and check it's validity.
 * @param password - The password to check.
 * @returns The parsed password.
 * @throws Error when password is empty or not a string.
 */
export function parsePassword(
  password: string | qs.ParsedQs | string[] | qs.ParsedQs[] | undefined,
): string {
  if (
    password === undefined ||
    (typeof password === 'string' && password.length == 0)
  ) {
    throw new Error('Password was not specified.');
  }

  if (typeof password !== 'string') {
    throw new Error('Password is of the wrong type.');
  }

  return password;
}
