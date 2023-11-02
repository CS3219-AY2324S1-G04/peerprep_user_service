/**
 * @file Defines {@link DatabaseConfig}.
 */
import assert from 'assert';

/** Configs for the database. */
export default class DatabaseConfig {
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
   * {@link databaseMaxClientCount}.
   */
  public static readonly databaseMaxClientCountEnvVar: string =
    'DATABASE_MAX_CLIENT_COUNT';
  /** Name of the environment variable corresponding to {@link hashCost}. */
  public static readonly hashCostEnvVar: string = 'HASH_COST';

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
  /** Default value for {@link databaseMaxClientCount}. */
  public static readonly defaultDatabaseMaxClientCount: number = 20;
  /** Default value for {@link hashCost}. */
  public static readonly defaultHashCost: number = 10;

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
  /** Max number of clients. */
  public readonly databaseMaxClientCount: number;
  /** Cost factor of the password hashing algorithm. */
  public readonly hashCost: number;

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
      env[DatabaseConfig.databasePasswordEnvVar] !== undefined &&
        env[DatabaseConfig.databasePasswordEnvVar] !== '',
      `Database password not specified via the environment variable "${DatabaseConfig.databasePasswordEnvVar}".`,
    );

    this.databasePassword = DatabaseConfig._parseString(
      env[DatabaseConfig.databasePasswordEnvVar],
    ) as string;
    this.databaseUser =
      DatabaseConfig._parseString(env[DatabaseConfig.databaseUserEnvVar]) ??
      DatabaseConfig.defaultDatabaseUser;
    this.databaseHost =
      DatabaseConfig._parseString(env[DatabaseConfig.databaseHostEnvVar]) ??
      DatabaseConfig.defaultDatabaseHost;
    this.databasePort =
      DatabaseConfig._parseInt(env[DatabaseConfig.databasePortEnvVar]) ??
      DatabaseConfig.defaultDatabasePort;
    this.databaseName =
      DatabaseConfig._parseString(env[DatabaseConfig.databaseNameEnvVar]) ??
      DatabaseConfig.defaultDatabaseName;
    this.databaseConnectionTimeoutMillis =
      DatabaseConfig._parseInt(
        env[DatabaseConfig.databaseConnectionTimeoutMillisEnvVar],
      ) ?? DatabaseConfig.defaultDatabaseConnectionTimeoutMillis;
    this.databaseMaxClientCount =
      DatabaseConfig._parseInt(
        env[DatabaseConfig.databaseMaxClientCountEnvVar],
      ) ?? DatabaseConfig.defaultDatabaseMaxClientCount;
    this.hashCost =
      DatabaseConfig._parseInt(env[DatabaseConfig.hashCostEnvVar]) ??
      DatabaseConfig.defaultHashCost;
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
