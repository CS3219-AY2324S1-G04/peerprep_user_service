/**
 * @file Defines {@link ClientModifiableUserProfile}.
 */

/** User profile information that is modifiable by a HTTP client. */
export default interface ClientModifiableUserProfile {
  /** Username. */
  readonly username: string;
  /** Email. */
  readonly email: string;
}
