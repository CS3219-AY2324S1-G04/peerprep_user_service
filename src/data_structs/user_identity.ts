/**
 * @file Defines {@link UserIdentity}.
 */
import UserRole from '../enums/user_role';
import { userIdKey, userRoleKey } from '../utils/parameter_keys';
import UserId from './user_id';

/** User identity. */
export default interface UserIdentity {
  /** Unique ID. */
  readonly userId: UserId;
  /** User role. */
  readonly userRole: UserRole;
}

/**
 * Create a JSON compatible object using the contents of {@link userIdentity}.
 * The key names of the object uses the REST API parameter names.
 * @param userIdentity - User identity.
 * @returns JSON compatible object containing the contents of the user identity
 * {@link userIdentity}.
 */
export function createJsonCompatibleUserIdentity(userIdentity: UserIdentity) {
  return {
    [userIdKey]: userIdentity.userId.toNumber(),
    [userRoleKey]: userIdentity.userRole.toString(),
  };
}
