/**
 * @file Defines {@link DatabaseInitialiserConfig}.
 */
import EmailAddress from '../data_structs/email_address';
import Password from '../data_structs/password';

/** Configs for the database initialiser. */
export default class DatabaseInitialiserConfig {
  /**
   * Name of the environment variable corresponding to
   * {@link adminEmailAddress}.
   */
  public static readonly adminEmailAddressEnvVar: string =
    'ADMIN_EMAIL_ADDRESS';
  /**
   * Name of the environment variable corresponding to {@link adminPassword}.
   */
  public static readonly adminPasswordEnvVar: string = 'ADMIN_PASSWORD';

  /** Default admin user's email address. */
  public readonly adminEmailAddress: EmailAddress;
  /** Default admin user's password. */
  public readonly adminPassword: Password;

  /**
   * Constructs a {@link DatabaseInitialiserConfig} and assigns to each field,
   * the value stored in their corresponding environment variable.
   * @param env - Environment variables.
   */
  public constructor(env: NodeJS.ProcessEnv = process.env) {
    this.adminEmailAddress = EmailAddress.parse(
      env[DatabaseInitialiserConfig.adminEmailAddressEnvVar],
    );
    this.adminPassword = Password.parse(
      env[DatabaseInitialiserConfig.adminPasswordEnvVar],
    );
  }
}
