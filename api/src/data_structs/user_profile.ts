/**
 * @file Defines {@link UserProfile}.
 */
import ClientModifiableUserProfile from './uncreated_user_profile';
import UserIdentity from './user_identity';

/** Represents a user's profile. */
export default interface UserProfile
  extends UserIdentity,
    ClientModifiableUserProfile {}
