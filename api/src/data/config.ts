/**
 * @file Defines {@link Config}.
 */
import assert from 'assert';

/** Represents the app's configs. */
export default class Config {
  /** Name of the environment variable corresponding to {@link pgPassword}. */
  public static readonly pgPasswordEnvVar: string = 'PG_PASSWORD';
  /** Name of the environment variable corresponding to {@link pgUser}. */
  public static readonly pgUserEnvVar: string = 'PG_USER';
  /** Name of the environment variable corresponding to {@link pgHost}. */
  public static readonly pgHostEnvVar: string = 'PG_HOST';
  /** Name of the environment variable corresponding to {@link pgPort}. */
  public static readonly pgPortEnvVar: string = 'PG_PORT';
  /** Name of the environment variable corresponding to {@link pgDatabase}. */
  public static readonly pgDatabaseEnvVar: string = 'PG_DATABASE';

  /**
   * Name of the environment variable corresponding to
   * {@link pgPoolConnectionTimeoutMillis}.
   */
  public static readonly pgPoolConnectionTimeoutMillisEnvVar: string =
    'PG_POOL_CONNECTION_TIMEOUT_MILLIS';
  /**
   * Name of the environment variable corresponding to
   * {@link pgPoolIdleTimeoutMillis}.
   */
  public static readonly pgPoolIdleTimeoutMillisEnvVar: string =
    'PG_POOL_IDLE_TIMEOUT_MILLIS';
  /** Name of the environment variable corresponding to {@link pgPoolMax}. */
  public static readonly pgPoolMaxEnvVar: string = 'PG_POOL_MAX';

  /** Name of the environment variable corresponding to {@link port}. */
  public static readonly portEnvVar: string = 'PORT';
  /** Name of the environment variable corresponding to {@link hashCost}. */
  public static readonly hashCostEnvVar: string = 'HASH_COST';
  /**
   * Name of the environment variable corresponding to
   * {@link sessionExpireMillis}.
   */
  public static readonly sessionExpireMillisEnvVar: string =
    'SESSION_EXPIRE_MILLIS';

  /** Default value for {@link pgUser}. */
  public static readonly defaultPgUser: string = 'postgres';
  /** Default value for {@link pgHost}. */
  public static readonly defaultPgHost: string = 'localhost';
  /** Default value for {@link pgPort}. */
  public static readonly defaultPgPort: number = 5432;
  /** Default value for {@link pgDatabase}. */
  public static readonly defaultPgDatabase: string = 'user';

  /** Default value for {@link pgPoolConnectionTimeoutMillis}. */
  public static readonly defaultPgPoolConnectionTimeoutMillis: number = 0;
  /** Default value for {@link pgPoolIdleTimeoutMillis}. */
  public static readonly defaultPgPoolIdleTimeoutMillis: number = 10000;
  /** Default value for {@link pgPoolMax}. */
  public static readonly defaultPgPoolMax: number = 20;

  /** Default value for {@link port}. */
  public static readonly defaultPort: number = 3000;
  /** Default value for {@link hashCost}. */
  public static readonly defaultHashCost: number = 10;
  /** Default value for {@link sessionExpireMillis}. */
  public static readonly defaultSessionExpireMillis: number = 604800000;

  /** Password of the database.*/
  public readonly pgPassword: string;
  /** User on the database host. */
  public readonly pgUser: string;
  /** Address of the database host. */
  public readonly pgHost: string;
  /** Port of the database host that the database is listening on. */
  public readonly pgPort: number;
  /** Name of the database. */
  public readonly pgDatabase: string;

  /**
   * Number of milliseconds for a client to connect to the database before
   * timing out.
   */
  public readonly pgPoolConnectionTimeoutMillis: number;
  /**
   * Number of milliseconds a client can remain idle for before being
   * disconnected.
   */
  public readonly pgPoolIdleTimeoutMillis: number;
  /** Max number of clients. */
  public readonly pgPoolMax: number;

  /** Port that the app will listen on. */
  public readonly port: number;
  /** Cost factor of the password hashing algorithm. */
  public readonly hashCost: number;
  /** Number of milliseconds a user login session can last for. */
  public readonly sessionExpireMillis: number;

  /**
   * Constructs a Config and assigns to each field, the value stored in their
   * corresponding environment variable. If an environment variable does not
   * have a valid value, assigns a default value instead.
   *
   * {@link pgPassword} has no default value and must be specified in the
   * {@link pgPasswordEnvVar} environment variable.
   * @param env - Environment variables.
   */
  public constructor(env: NodeJS.ProcessEnv = process.env) {
    assert(
      env[Config.pgPasswordEnvVar] !== undefined,
      'Postgres database password not specified via the environment variable "PG_PASSWORD".',
    );

    this.pgPassword = Config._parseString(
      env[Config.pgPasswordEnvVar],
    ) as string;
    this.pgUser =
      Config._parseString(env[Config.pgUserEnvVar]) ?? Config.defaultPgUser;
    this.pgHost =
      Config._parseString(env[Config.pgHostEnvVar]) ?? Config.defaultPgHost;
    this.pgPort =
      Config._parseInt(env[Config.pgPortEnvVar]) ?? Config.defaultPgPort;
    this.pgDatabase =
      Config._parseString(env[Config.pgDatabaseEnvVar]) ??
      Config.defaultPgDatabase;

    this.pgPoolConnectionTimeoutMillis =
      Config._parseInt(env[Config.pgPoolConnectionTimeoutMillisEnvVar]) ??
      Config.defaultPgPoolConnectionTimeoutMillis;
    this.pgPoolIdleTimeoutMillis =
      Config._parseInt(env[Config.pgPoolIdleTimeoutMillisEnvVar]) ??
      Config.defaultPgPoolIdleTimeoutMillis;
    this.pgPoolMax =
      Config._parseInt(env[Config.pgPoolMaxEnvVar]) ?? Config.defaultPgPoolMax;

    this.port = Config._parseInt(env[Config.portEnvVar]) ?? Config.defaultPort;
    this.hashCost =
      Config._parseInt(env[Config.hashCostEnvVar]) ?? Config.defaultHashCost;
    this.sessionExpireMillis =
      Config._parseInt(env[Config.sessionExpireMillisEnvVar]) ??
      Config.defaultSessionExpireMillis;
  }

  private static _parseString(raw: string | undefined): string | undefined {
    if (raw === undefined || raw === '') {
      return undefined;
    }

    return raw;
  }

  private static _parseInt(raw: string | undefined): number | undefined {
    if (raw === undefined) {
      return undefined;
    }

    const val: number = parseFloat(raw);
    if (isNaN(val) || !Number.isInteger(val)) {
      return undefined;
    }

    return val;
  }
}
