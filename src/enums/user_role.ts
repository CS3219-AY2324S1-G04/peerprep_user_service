/**
 * @file Defines {@link UserRole}.
 */

/** User role. */
enum UserRole {
  user = 'user',
  maintainer = 'maintainer',
  admin = 'admin',
}

/**
 * Parses {@link rawUserRole} as a user role.
 * @param rawUserRole - Value to parse.
 * @returns The parsed user role.
 * @throws {Error} if parsing fails.
 */
export function parseUserRole(rawUserRole: unknown): UserRole {
  if (!isString(rawUserRole)) {
    throw new Error('User role must be a string.');
  }

  if (!isStringSpecified(rawUserRole as string | undefined)) {
    throw new Error('User role cannot be empty.');
  }

  const userRole: UserRole | undefined = tryParseUserRole(
    rawUserRole as string,
  );

  if (userRole === undefined) {
    throw new Error('User role is invalid.');
  }

  return userRole;
}

function isString(rawUserRole: unknown): boolean {
  return typeof rawUserRole === 'string' || rawUserRole === undefined;
}

function isStringSpecified(rawUserRole: string | undefined): boolean {
  return rawUserRole !== undefined && rawUserRole.length > 0;
}

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
