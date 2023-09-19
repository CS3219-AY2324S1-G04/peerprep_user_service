/**
 * @file Tests for {@link Config}.
 */
import { AssertionError } from 'assert';

import Config from '../../src/data/config';

describe('Config', () => {
  describe('constructor', () => {
    const baseConfig: Config = {
      pgPassword: 'password123',
      pgUser: 'postgres_user',
      pgHost: 'postgres_host',
      pgPort: 100,
      pgDatabase: 'postgres_database',
      pgPoolConnectionTimeoutMillis: 101,
      pgPoolIdleTimeoutMillis: 102,
      pgPoolMax: 103,
      port: 104,
      hashCost: 105,
      sessionExpireMillis: 106,
    };

    const defaultPgUserConfig: Config = new Config(
      createEnv(baseConfig, [
        { name: Config.pgUserEnvVar, val: Config.defaultPgUser },
      ]),
    );
    const defaultPgHostConfig: Config = new Config(
      createEnv(baseConfig, [
        { name: Config.pgHostEnvVar, val: Config.defaultPgHost },
      ]),
    );
    const defaultPgPortConfig: Config = new Config(
      createEnv(baseConfig, [
        { name: Config.pgPortEnvVar, val: Config.defaultPgPort.toString() },
      ]),
    );
    const defaultPgDatabaseConfig: Config = new Config(
      createEnv(baseConfig, [
        { name: Config.pgDatabaseEnvVar, val: Config.defaultPgDatabase },
      ]),
    );
    const defaultPgPoolConnectionTimeoutMillisConfig: Config = new Config(
      createEnv(baseConfig, [
        {
          name: Config.pgPoolConnectionTimeoutMillisEnvVar,
          val: Config.defaultPgPoolConnectionTimeoutMillis.toString(),
        },
      ]),
    );
    const defaultPgPoolIdleTimeoutMillisConfig: Config = new Config(
      createEnv(baseConfig, [
        {
          name: Config.pgPoolIdleTimeoutMillisEnvVar,
          val: Config.defaultPgPoolIdleTimeoutMillis.toString(),
        },
      ]),
    );
    const defaultPgPoolMaxConfig: Config = new Config(
      createEnv(baseConfig, [
        {
          name: Config.pgPoolMaxEnvVar,
          val: Config.defaultPgPoolMax.toString(),
        },
      ]),
    );
    const defaultPortConfig: Config = new Config(
      createEnv(baseConfig, [
        { name: Config.portEnvVar, val: Config.defaultPort.toString() },
      ]),
    );
    const defaultHashCostConfig: Config = new Config(
      createEnv(baseConfig, [
        { name: Config.hashCostEnvVar, val: Config.defaultHashCost.toString() },
      ]),
    );
    const defaultSessionExpireMillisConfig: Config = new Config(
      createEnv(baseConfig, [
        {
          name: Config.sessionExpireMillisEnvVar,
          val: Config.defaultSessionExpireMillis.toString(),
        },
      ]),
    );

    test('All environment variables present | Returns Config with values', () => {
      expect(new Config(createEnv(baseConfig))).toEqual(baseConfig);
    });

    test('PG_PASSWORD missing | Throws AssertionError', () => {
      const env: NodeJS.ProcessEnv = createEnv(baseConfig);
      delete env[Config.pgPasswordEnvVar];

      expect(() => new Config(env)).toThrow(AssertionError);
    });

    test.each([
      {
        envVar: Config.pgUserEnvVar,
        expected: defaultPgUserConfig,
      },
      {
        envVar: Config.pgHostEnvVar,
        expected: defaultPgHostConfig,
      },
      {
        envVar: Config.pgPortEnvVar,
        expected: defaultPgPortConfig,
      },
      {
        envVar: Config.pgDatabaseEnvVar,
        expected: defaultPgDatabaseConfig,
      },
      {
        envVar: Config.pgPoolConnectionTimeoutMillisEnvVar,
        expected: defaultPgPoolConnectionTimeoutMillisConfig,
      },
      {
        envVar: Config.pgPoolIdleTimeoutMillisEnvVar,
        expected: defaultPgPoolIdleTimeoutMillisConfig,
      },
      {
        envVar: Config.pgPoolMaxEnvVar,
        expected: defaultPgPoolMaxConfig,
      },
      {
        envVar: Config.portEnvVar,
        expected: defaultPortConfig,
      },
      {
        envVar: Config.hashCostEnvVar,
        expected: defaultHashCostConfig,
      },
      {
        envVar: Config.sessionExpireMillisEnvVar,
        expected: defaultSessionExpireMillisConfig,
      },
    ])(
      '$envVar missing | Returns Config with default value for $envVar',
      ({ envVar, expected }: { envVar: string; expected: Config }) => {
        const env: NodeJS.ProcessEnv = createEnv(baseConfig);
        delete env[envVar];

        expect(new Config(env)).toEqual(expected);
      },
    );

    test.each([
      {
        envVar: Config.pgPortEnvVar,
        expected: defaultPgPortConfig,
      },
      {
        envVar: Config.pgPoolConnectionTimeoutMillisEnvVar,
        expected: defaultPgPoolConnectionTimeoutMillisConfig,
      },
      {
        envVar: Config.pgPoolIdleTimeoutMillisEnvVar,
        expected: defaultPgPoolIdleTimeoutMillisConfig,
      },
      {
        envVar: Config.pgPoolMaxEnvVar,
        expected: defaultPgPoolMaxConfig,
      },
      {
        envVar: Config.portEnvVar,
        expected: defaultPortConfig,
      },
      {
        envVar: Config.hashCostEnvVar,
        expected: defaultHashCostConfig,
      },
      {
        envVar: Config.sessionExpireMillisEnvVar,
        expected: defaultSessionExpireMillisConfig,
      },
    ])(
      '$envVar is not an integer | Returns Config with default value for $envVar',
      ({ envVar, expected }: { envVar: string; expected: Config }) => {
        const notNumberEnv: NodeJS.ProcessEnv = createEnv(baseConfig);
        notNumberEnv[envVar] = 'Not a number';
        expect(new Config(notNumberEnv)).toEqual(expected);

        const notIntegerEnv: NodeJS.ProcessEnv = createEnv(baseConfig);
        notIntegerEnv[envVar] = '3.142';
        expect(new Config(notIntegerEnv)).toEqual(expected);
      },
    );
  });
});

/**
 * Creates a {@link NodeJS.ProcessEnv} object populated with the environment
 * variables utilised by {@link Config} assigned with values from
 * {@link config}.
 * @param config - Values to be stored as environment variables.
 * @param extras - Additional environment variables which can potentially
 * overwrite the values provided by {@link config}.
 * @returns The created {@link NodeJS.ProcessEnv} object.
 */
function createEnv(
  config: Config,
  extras: { name: string; val: string }[] = [],
): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  env[Config.pgPasswordEnvVar] = config.pgPassword;
  env[Config.pgUserEnvVar] = config.pgUser;
  env[Config.pgHostEnvVar] = config.pgHost;
  env[Config.pgPortEnvVar] = config.pgPort.toString();
  env[Config.pgDatabaseEnvVar] = config.pgDatabase;
  env[Config.pgPoolConnectionTimeoutMillisEnvVar] =
    config.pgPoolConnectionTimeoutMillis.toString();
  env[Config.pgPoolIdleTimeoutMillisEnvVar] =
    config.pgPoolIdleTimeoutMillis.toString();
  env[Config.pgPoolMaxEnvVar] = config.pgPoolMax.toString();
  env[Config.portEnvVar] = config.port.toString();
  env[Config.hashCostEnvVar] = config.hashCost.toString();
  env[Config.sessionExpireMillisEnvVar] = config.sessionExpireMillis.toString();

  for (const extra of extras) {
    env[extra.name] = extra.val;
  }

  return env;
}
