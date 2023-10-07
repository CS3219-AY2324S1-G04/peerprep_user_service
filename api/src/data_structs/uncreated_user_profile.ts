/**
 * @file Defines {@link ClientModifiableUserProfile}.
 */
import EmailAddress from './email_address';
import Username from './username';

/** User profile information that is modifiable by a HTTP client. */
export default interface ClientModifiableUserProfile {
  /** Username. */
  readonly username: Username;
  /** Email. */
  readonly email: EmailAddress;
}

/** JSON string compatible {@link ClientModifiableUserProfile}. */
export interface JsonClientModifiableUserProfile {
  /** Username. */
  readonly username: string;
  /** Email. */
  readonly email: string;
}
