/**
 * @file Defines {@link UserIdentity}.
 */
import UserRole from '../enums/user_role';
import UserId from './user_id';

/** User identity. */
export default interface UserIdentity {
  /** Unique ID. */
  readonly userId: UserId;
  /** User role. */
  readonly userRole: UserRole;
}

/** JSON string compatible {@link UserIdentity}. */
export class JsonUserIdentity {
  /** Unique ID. */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  public readonly 'user-id': number;
  // /** User role. */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  public readonly 'user-role': string;

  public constructor(userIdentity: UserIdentity) {
    this['user-id'] = userIdentity.userId.userId;
    this['user-role'] = userIdentity.userRole;
  }
}
