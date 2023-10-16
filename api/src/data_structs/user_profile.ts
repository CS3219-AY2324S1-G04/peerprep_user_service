/**
 * @file Defines {@link UserProfile}.
 */
import ClientModifiableUserProfile, {
  JsonClientModifiableUserProfile,
} from './uncreated_user_profile';
import UserIdentity, { JsonUserIdentity } from './user_identity';

/** User's profile. */
export default interface UserProfile
  extends UserIdentity,
    ClientModifiableUserProfile {}

/** JSON string compatible {@link UserProfile}. */
export class JsonUserProfile
  implements JsonUserIdentity, JsonClientModifiableUserProfile
{
  public readonly username: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  public readonly 'email-address': string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  public readonly 'user-id': number;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  public readonly 'user-role': string;

  public constructor(userProfile: UserProfile) {
    this['username'] = userProfile.username.username;
    this['email-address'] = userProfile.emailAddress.emailAddress;
    this['user-id'] = userProfile.userId.userId;
    this['user-role'] = userProfile.userRole;
  }
}
