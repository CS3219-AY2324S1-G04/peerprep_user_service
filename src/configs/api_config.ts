/**
 * @file Defines {@link ApiConfig}.
 */
import assert from 'assert';

import { parseIntStrict } from '../utils/parser_utils';

/** Configs for the REST API app. */
export default class ApiConfig {
  /**
   * Name of the environment variable corresponding to
   * {@link accessTokenPrivateKey}.
   */
  public static readonly accessTokenPrivateKeyEnvVar: string =
    'ACCESS_TOKEN_PRIVATE_KEY';
  /**
   * Name of the environment variable corresponding to
   * {@link accessTokenPublicKey}.
   */
  public static readonly accessTokenPublicKeyEnvVar: string =
    'ACCESS_TOKEN_PUBLIC_KEY';
  /**
   * Name of the environment variable corresponding to
   * {@link sessionExpireMillis}.
   */
  public static readonly sessionExpireMillisEnvVar: string =
    'SESSION_EXPIRE_MILLIS';
  /**
   * Name of the environment variable corresponding to
   * {@link accessTokenExpireMillis}.
   */
  public static readonly accessTokenExpireMillisEnvVar: string =
    'ACCESS_TOKEN_EXPIRE_MILLIS';
  /** Name of the environment variable corresponding to {@link port}. */
  public static readonly portEnvVar: string = 'PORT';
  /**
   * Name of the environment variable which contains the mode the app is running
   * in. This is use for determining {@link isDevEnv}.
   */
  public static readonly appModeEnvVar: string = 'NODE_ENV';

  /** Default value for {@link sessionExpireMillis}. */
  public static readonly defaultSessionExpireMillis: number = 604800000;
  /** Default value for {@link accessTokenExpireMillis}. */
  public static readonly defaultAccessTokenExpireMillis: number = 900000;
  /** Default value for {@link port}. */
  public static readonly defaultPort: number = 9000;

  /** Private key for creating access tokens. */
  public readonly accessTokenPrivateKey: string;
  /** Public key for verifying access tokens. */
  public readonly accessTokenPublicKey: string;
  /**
   * Number of milliseconds a user session can last for.
   *
   * Session lifespan can be extended but will always be at most
   * {@link sessionExpireMillis} milliseconds from the current time.
   */
  public readonly sessionExpireMillis: number;
  /** Number of milliseconds an access token remains valid for. */
  public readonly accessTokenExpireMillis: number;
  /** Port that the app will listen on. */
  public readonly port: number;
  /** Boolean for whether developer features should be enabled. */
  public readonly isDevEnv: boolean;

  /**
   * Constructs an {@link ApiConfig} and assigns to each field, the value stored
   * in their corresponding environment variable. If an environment variable
   * does not have a valid value, assigns a default value instead.
   *
   * {@link accessTokenPrivateKey} and {@link accessTokenPublicKey} have no
   * default values and must be specified in the
   * {@link accessTokenPrivateKeyEnvVar} and {@link accessTokenPublicKeyEnvVar}
   * environment variables respectively.
   * @param env - Environment variables.
   */
  public constructor(env: NodeJS.ProcessEnv = process.env) {
    assert(
      env[ApiConfig.accessTokenPrivateKeyEnvVar] !== undefined &&
        env[ApiConfig.accessTokenPrivateKeyEnvVar] !== '',
      `Private key for generating access tokens was not specified via the environment variable "${ApiConfig.accessTokenPrivateKeyEnvVar}."`,
    );

    assert(
      env[ApiConfig.accessTokenPublicKeyEnvVar] !== undefined &&
        env[ApiConfig.accessTokenPublicKeyEnvVar] !== '',
      `Public key for generating access tokens was not specified via the environment variable "${ApiConfig.accessTokenPublicKeyEnvVar}."`,
    );

    this.accessTokenPrivateKey = env[ApiConfig.accessTokenPrivateKeyEnvVar]!;
    this.accessTokenPublicKey = env[ApiConfig.accessTokenPublicKeyEnvVar]!;
    this.sessionExpireMillis =
      parseIntStrict(env[ApiConfig.sessionExpireMillisEnvVar]) ??
      ApiConfig.defaultSessionExpireMillis;
    this.accessTokenExpireMillis =
      parseIntStrict(env[ApiConfig.accessTokenExpireMillisEnvVar]) ??
      ApiConfig.defaultAccessTokenExpireMillis;
    this.port =
      parseIntStrict(env[ApiConfig.portEnvVar]) ?? ApiConfig.defaultPort;
    this.isDevEnv = env[ApiConfig.appModeEnvVar] === 'development';
  }
}
