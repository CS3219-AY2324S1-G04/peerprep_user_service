/**
 * @file Defines {@link CoreConfig}.
 */
import { parseIntStrict } from '../utils/parser_utils';

/**
 * Configs for core service operations.
 *
 * These are misc configs utilised by the REST API app as well as the database
 * initialiser.
 */
export default class CoreConfig {
  /** Name of the environment variable corresponding to {@link hashCost}. */
  public static readonly hashCostEnvVar: string = 'HASH_COST';

  /** Default value for {@link hashCost}. */
  public static readonly defaultHashCost: number = 10;

  /** Cost factor of the password hashing algorithm. */
  public readonly hashCost: number;

  /**
   * Constructs a {@link CoreConfig} and assigns to each field, the value stored
   * in their corresponding environment variable. If an environment variable
   * does not have a valid value, assigns a default value instead.
   * @param env - Environment variables.
   */
  public constructor(env: NodeJS.ProcessEnv = process.env) {
    this.hashCost =
      parseIntStrict(env[CoreConfig.hashCostEnvVar]) ??
      CoreConfig.defaultHashCost;
  }
}
