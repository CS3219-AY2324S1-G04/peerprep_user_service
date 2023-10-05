/**
 * @file Defines {@link UserIdentity}.
 */
import UserRole from '../enums/user_role';

/** Represents a user's identity. */
export default interface UserIdentity {
  /** Unique ID. */
  readonly userId: number;
  /** Role. */
  readonly userRole: UserRole;
}
