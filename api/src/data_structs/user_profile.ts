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
  public readonly emailAddress: string;
  public readonly userId: number;
  public readonly userRole: string;

  public constructor(userProfile: UserProfile) {
    this.username = userProfile.username.username;
    this.emailAddress = userProfile.emailAddress.emailAddress;
    this.userId = userProfile.userId.userId;
    this.userRole = userProfile.userRole;
  }
}
