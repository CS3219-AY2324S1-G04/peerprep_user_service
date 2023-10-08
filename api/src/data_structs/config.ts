/**
 * @file Defines {@link Config}.
 */
import assert from 'assert';

// TODO: Make names unspecific to Postgres
/** Represents the app's configs. */
export default class Config {
  /**
   * Name of the environment variable corresponding to {@link databasePassword}.
   */
  public static readonly databasePasswordEnvVar: string = 'DATABASE_PASSWORD';
  /** Name of the environment variable corresponding to {@link databaseUser}. */
  public static readonly databaseUserEnvVar: string = 'DATABASE_USER';
  /** Name of the environment variable corresponding to {@link databaseHost}. */
  public static readonly databaseHostEnvVar: string = 'DATABASE_HOST';
  /** Name of the environment variable corresponding to {@link databasePort}. */
  public static readonly databasePortEnvVar: string = 'DATABASE_PORT';
  /**
   * Name of the environment variable corresponding to {@link databaseName}.
   */
  public static readonly databaseNameEnvVar: string = 'DATABASE_NAME';

  /**
   * Name of the environment variable corresponding to
   * {@link databaseConnectionTimeoutMillis}.
   */
  public static readonly databaseConnectionTimeoutMillisEnvVar: string =
    'DATABASE_CONNECTION_TIMEOUT_MILLIS';
  /**
   * Name of the environment variable corresponding to
   * {@link databaseIdleTimeoutMillis}.
   */
  public static readonly databaseIdleTimeoutMillisEnvVar: string =
    'DATABASE_IDLE_TIMEOUT_MILLIS';
  /**
   * Name of the environment variable corresponding to
   * {@link databaseMaxClientCount}.
   */
  public static readonly databaseMaxClientCountEnvVar: string =
    'DATABASE_MAX_CLIENT_COUNT';

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

  /** Default value for {@link databaseUser}. */
  public static readonly defaultDatabaseUser: string = 'postgres';
  /** Default value for {@link databaseHost}. */
  public static readonly defaultDatabaseHost: string = 'localhost';
  /** Default value for {@link databasePort}. */
  public static readonly defaultDatabasePort: number = 5432;
  /** Default value for {@link databaseName}. */
  public static readonly defaultDatabaseName: string = 'user';

  /** Default value for {@link databaseConnectionTimeoutMillis}. */
  public static readonly defaultDatabaseConnectionTimeoutMillis: number = 0;
  /** Default value for {@link databaseIdleTimeoutMillis}. */
  public static readonly defaultDatabaseIdleTimeoutMillis: number = 10000;
  /** Default value for {@link databaseMaxClientCount}. */
  public static readonly defaultDatabaseMaxClientCount: number = 20;

  /** Default value for {@link port}. */
  public static readonly defaultPort: number = 3000;
  /** Default value for {@link hashCost}. */
  public static readonly defaultHashCost: number = 10;
  /** Default value for {@link sessionExpireMillis}. */
  public static readonly defaultSessionExpireMillis: number = 604800000;

  /** Password of the database.*/
  public readonly databasePassword: string;
  /** User on the database host. */
  public readonly databaseUser: string;
  /** Address of the database host. */
  public readonly databaseHost: string;
  /** Port of the database host that the database is listening on. */
  public readonly databasePort: number;
  /** Name of the database. */
  public readonly databaseName: string;

  /**
   * Number of milliseconds for a client to connect to the database before
   * timing out.
   */
  public readonly databaseConnectionTimeoutMillis: number;
  /**
   * Number of milliseconds a client can remain idle for before being
   * disconnected.
   */
  public readonly databaseIdleTimeoutMillis: number;
  /** Max number of clients. */
  public readonly databaseMaxClientCount: number;

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
   * {@link databasePassword} has no default value and must be specified in the
   * {@link databasePasswordEnvVar} environment variable.
   * @param env - Environment variables.
   */
  public constructor(env: NodeJS.ProcessEnv = process.env) {
    assert(
      env[Config.databasePasswordEnvVar] !== undefined,
      `Postgres database password not specified via the environment variable "${Config.databasePasswordEnvVar}".`,
    );

    this.databasePassword = Config._parseString(
      env[Config.databasePasswordEnvVar],
    ) as string;
    this.databaseUser =
      Config._parseString(env[Config.databaseUserEnvVar]) ??
      Config.defaultDatabaseUser;
    this.databaseHost =
      Config._parseString(env[Config.databaseHostEnvVar]) ??
      Config.defaultDatabaseHost;
    this.databasePort =
      Config._parseInt(env[Config.databasePortEnvVar]) ??
      Config.defaultDatabasePort;
    this.databaseName =
      Config._parseString(env[Config.databaseNameEnvVar]) ??
      Config.defaultDatabaseName;

    this.databaseConnectionTimeoutMillis =
      Config._parseInt(env[Config.databaseConnectionTimeoutMillisEnvVar]) ??
      Config.defaultDatabaseConnectionTimeoutMillis;
    this.databaseIdleTimeoutMillis =
      Config._parseInt(env[Config.databaseIdleTimeoutMillisEnvVar]) ??
      Config.defaultDatabaseIdleTimeoutMillis;
    this.databaseMaxClientCount =
      Config._parseInt(env[Config.databaseMaxClientCountEnvVar]) ??
      Config.defaultDatabaseMaxClientCount;

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
