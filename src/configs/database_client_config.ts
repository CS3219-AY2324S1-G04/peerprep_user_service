/**
 * @file Defines {@link DatabaseClientConfig}.
 */
import assert from 'assert';

import { parseIntStrict } from '../utils/parser_utils';

/** Configs for the database client. */
export default class DatabaseClientConfig {
  /** Name of the environment variable corresponding to {@link user}. */
  public static readonly userEnvVar: string = 'DATABASE_USER';
  /**
   * Name of the environment variable corresponding to {@link password}.
   */
  public static readonly passwordEnvVar: string = 'DATABASE_PASSWORD';
  /** Name of the environment variable corresponding to {@link host}. */
  public static readonly hostEnvVar: string = 'DATABASE_HOST';
  /** Name of the environment variable corresponding to {@link port}. */
  public static readonly portEnvVar: string = 'DATABASE_PORT';
  /**
   * Name of the environment variable corresponding to {@link databaseName}.
   */
  public static readonly databaseNameEnvVar: string = 'DATABASE_NAME';
  /**
   * Name of the environment variable corresponding to
   * {@link connectionTimeoutMillis}.
   */
  public static readonly connectionTimeoutMillisEnvVar: string =
    'DATABASE_CONNECTION_TIMEOUT_MILLIS';
  /**
   * Name of the environment variable corresponding to
   * {@link maxClientCount}.
   */
  public static readonly databaseMaxClientCountEnvVar: string =
    'DATABASE_MAX_CLIENT_COUNT';

  /** Default value for {@link user}. */
  public static readonly defaultUser: string = 'user';
  /** Default value for {@link host}. */
  public static readonly defaultHost: string = 'localhost';
  /** Default value for {@link port}. */
  public static readonly defaultPort: number = 5432;
  /** Default value for {@link databaseName}. */
  public static readonly defaultDatabaseName: string = 'user';
  /** Default value for {@link connectionTimeoutMillis}. */
  public static readonly defaultConnectionTimeoutMillis: number = 0;
  /** Default value for {@link maxClientCount}. */
  public static readonly defaultMaxClientCount: number = 20;

  /** User of the database. */
  public readonly user: string;
  /** Password of the database.*/
  public readonly password: string;
  /** Address of the database host. */
  public readonly host: string;
  /** Port of the database host that the database is listening on. */
  public readonly port: number;
  /** Name of the database. */
  public readonly databaseName: string;
  /**
   * Number of milliseconds for a client to connect to the database before
   * timing out.
   */
  public readonly connectionTimeoutMillis: number;
  /** Max number of clients. */
  public readonly maxClientCount: number;

  /**
   * Constructs a {@link DatabaseClientConfig} and assigns to each field, the
   * value stored in their corresponding environment variable. If an environment
   * variable does not have a valid value, assigns a default value instead.
   *
   * {@link password} has no default value and must be specified in the
   * {@link passwordEnvVar} environment variable.
   * @param env - Environment variables.
   */
  public constructor(env: NodeJS.ProcessEnv = process.env) {
    assert(
      env[DatabaseClientConfig.passwordEnvVar] !== undefined &&
        env[DatabaseClientConfig.passwordEnvVar] !== '',
      `Database password was not specified via the environment variable "${DatabaseClientConfig.passwordEnvVar}".`,
    );

    this.user =
      DatabaseClientConfig._parseString(env[DatabaseClientConfig.userEnvVar]) ??
      DatabaseClientConfig.defaultUser;
    this.password = DatabaseClientConfig._parseString(
      env[DatabaseClientConfig.passwordEnvVar],
    ) as string;
    this.host =
      DatabaseClientConfig._parseString(env[DatabaseClientConfig.hostEnvVar]) ??
      DatabaseClientConfig.defaultHost;
    this.port =
      parseIntStrict(env[DatabaseClientConfig.portEnvVar]) ??
      DatabaseClientConfig.defaultPort;
    this.databaseName =
      DatabaseClientConfig._parseString(
        env[DatabaseClientConfig.databaseNameEnvVar],
      ) ?? DatabaseClientConfig.defaultDatabaseName;
    this.connectionTimeoutMillis =
      parseIntStrict(env[DatabaseClientConfig.connectionTimeoutMillisEnvVar]) ??
      DatabaseClientConfig.defaultConnectionTimeoutMillis;
    this.maxClientCount =
      parseIntStrict(env[DatabaseClientConfig.databaseMaxClientCountEnvVar]) ??
      DatabaseClientConfig.defaultMaxClientCount;
  }

  private static _parseString(raw: string | undefined): string | undefined {
    if (raw === undefined || raw === '') {
      return undefined;
    }

    return raw;
  }
}
