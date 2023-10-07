/**
 * @file Defines {@link UserIdentity}.
 */
import UserRole from '../enums/user_role';
import UserId from './user_id';

/** User's identity. */
export default interface UserIdentity {
  /** Unique ID. */
  readonly userId: UserId;
  /** Role. */
  readonly userRole: UserRole;
}

/** JSON string compatible {@link UserIdentity}. */
export class JsonUserIdentity {
  /** Unique ID. */
  public readonly userId: number;
  /** Role. */
  public readonly userRole: string;

  public constructor(userIdentity: UserIdentity) {
    this.userId = userIdentity.userId.userId;
    this.userRole = userIdentity.userRole;
  }
}
