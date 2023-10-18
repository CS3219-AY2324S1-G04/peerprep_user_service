/**
 * @file Defines {@link UserProfile}.
 */
import {
  emailAddressKey,
  userIdKey,
  userRoleKey,
  usernameKey,
} from '../utils/parameter_keys';
import ClientModifiableUserProfile from './uncreated_user_profile';
import UserIdentity from './user_identity';

/** User's profile. */
export default interface UserProfile
  extends UserIdentity,
    ClientModifiableUserProfile {}

/**
 * Create a JSON string using the contents of {@link userProfile}. The
 * key names in the JSON string uses the REST API parameter names.
 * @param userProfile - User profile to stringify.
 * @returns JSON string of the user profile {@link userProfile}.
 */
export function jsonStringifyUserProfile(userProfile: UserProfile) {
  return {
    [usernameKey]: userProfile.username.toString(),
    [emailAddressKey]: userProfile.emailAddress.toString(),
    [userIdKey]: userProfile.userId.toNumber(),
    [userRoleKey]: userProfile.userRole.toString(),
  };
}
