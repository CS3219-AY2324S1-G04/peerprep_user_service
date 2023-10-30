/**
 * @file Defines {@link UserProfile}.
 */
import {
  emailAddressKey,
  userIdKey,
  userRoleKey,
  usernameKey,
} from '../utils/parameter_keys';
import ClientModifiableUserProfile from './client_modifiable_user_profile';
import UserIdentity from './user_identity';

/** User's profile. */
export default interface UserProfile
  extends UserIdentity,
    ClientModifiableUserProfile {}

/**
 * Create a JSON compatible object using the contents of {@link userProfile}.
 * The key names of the object uses the REST API parameter names.
 * @param userProfile - User profile.
 * @returns JSON compatible object containing the contents of the user profile
 * {@link userProfile}.
 */
export function createJsonCompatibleUserProfile(userProfile: UserProfile) {
  return {
    [usernameKey]: userProfile.username.toString(),
    [emailAddressKey]: userProfile.emailAddress.toString(),
    [userIdKey]: userProfile.userId.toNumber(),
    [userRoleKey]: userProfile.userRole.toString(),
  };
}
