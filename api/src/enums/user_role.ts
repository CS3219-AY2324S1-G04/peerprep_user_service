/**
 * @file Defines {@link UserRole}.
 */

/** User's role. */
enum UserRole {
  user = 'user',
  maintainer = 'maintainer',
  admin = 'admin',
}

/**
 * Parses {@link rawUserRole} as a user role and check it's validity.
 * @param rawUserRole - The user role to check.
 * @returns The parsed use role.
 * @throws Error if parsing fails.
 */
export function parseUserRole(
  rawUserRole: string | qs.ParsedQs | string[] | qs.ParsedQs[] | undefined,
): UserRole {
  if (!isUserRoleString(rawUserRole)) {
    throw new Error('User role must be a string.');
  }

  if (!isUserRoleSpecified(rawUserRole as string | undefined)) {
    throw new Error('User role cannot be empty.');
  }

  const userRole: UserRole | undefined = tryParseUserRole(
    rawUserRole as string,
  );

  if (userRole === undefined) {
    throw new Error('Role is invalid.');
  }

  return userRole;
}

/**
 * @param rawUserRole - User role.
 * @returns True if {@link rawUserRole} is a string or undefined. Else, returns
 * false.
 */
function isUserRoleString(
  rawUserRole: string | qs.ParsedQs | string[] | qs.ParsedQs[] | undefined,
): boolean {
  return typeof rawUserRole === 'string' || rawUserRole === undefined;
}

/**
 * @param rawUserRole - User role.
 * @returns True if {@link rawUserRole} is not undefined and is a non-empty
 * string). Else, returns false.
 */
function isUserRoleSpecified(rawUserRole: string | undefined): boolean {
  return rawUserRole !== undefined && rawUserRole.length > 0;
}

/**
 * Parses {@link userRole} and returns a {@link UserRole}.
 * @param userRole - User role.
 * @returns The {@link UserRole} that corresponds to the value in
 * {@link userRole}.
 */
function tryParseUserRole(userRole: string): UserRole | undefined {
  switch (userRole) {
    case 'user':
      return UserRole.user;
    case 'maintainer':
      return UserRole.maintainer;
    case 'admin':
      return UserRole.admin;
  }

  return undefined;
}

export default UserRole;
