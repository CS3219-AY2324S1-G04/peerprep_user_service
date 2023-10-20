/**
 * @file Defines {@link ApiConfig}.
 */
/** Configs for the REST API server. */
export default class ApiConfig {
  /** Name of the environment variable corresponding to {@link port}. */
  public static readonly portEnvVar: string = 'PORT';
  /**
   * Name of the environment variable corresponding to
   * {@link sessionExpireMillis}.
   */
  public static readonly sessionExpireMillisEnvVar: string =
    'SESSION_EXPIRE_MILLIS';
  /**
   * Name of the environment variable which contains the mode the app is running
   * in. This is use for determining {@link isDevEnv}.
   */
  public static readonly appModeEnvVar: string = 'NODE_ENV';

  /** Default value for {@link port}. */
  public static readonly defaultPort: number = 9000;
  /** Default value for {@link sessionExpireMillis}. */
  public static readonly defaultSessionExpireMillis: number = 604800000;

  /** Port that the app will listen on. */
  public readonly port: number;
  /** Number of milliseconds a user login session can last for. */
  public readonly sessionExpireMillis: number;
  /** Boolean for whether developer features should be enabled. */
  public readonly isDevEnv: boolean;

  /**
   * Constructs an {@link ApiConfig} and assigns to each field, the value stored
   * in their corresponding environment variable. If an environment variable
   * does not have a valid value, assigns a default value instead.
   * @param env - Environment variables.
   */
  public constructor(env: NodeJS.ProcessEnv = process.env) {
    this.port =
      ApiConfig._parseInt(env[ApiConfig.portEnvVar]) ?? ApiConfig.defaultPort;
    this.sessionExpireMillis =
      ApiConfig._parseInt(env[ApiConfig.sessionExpireMillisEnvVar]) ??
      ApiConfig.defaultSessionExpireMillis;
    this.isDevEnv = env[ApiConfig.appModeEnvVar] === 'development';
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
