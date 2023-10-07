/**
 * @file Tests for {@link Config}.
 */
import { AssertionError } from 'assert';

import Config from '../config';

describe('Config', () => {
  describe('constructor', () => {
    const baseConfig: Config = {
      databasePassword: 'password123',
      databaseUser: 'postgres_user',
      databaseHost: 'postgres_host',
      databasePort: 100,
      databaseName: 'postgres_database',
      databaseConnectionTimeoutMillis: 101,
      databaseIdleTimeoutMillis: 102,
      databaseMaxClientCount: 103,
      port: 104,
      hashCost: 105,
      sessionExpireMillis: 106,
    };

    const defaultPgUserConfig: Config = new Config(
      createEnv(baseConfig, [
        { name: Config.databaseUserEnvVar, val: Config.defaultDatabaseUser },
      ]),
    );
    const defaultPgHostConfig: Config = new Config(
      createEnv(baseConfig, [
        { name: Config.databaseHostEnvVar, val: Config.defaultDatabaseHost },
      ]),
    );
    const defaultPgPortConfig: Config = new Config(
      createEnv(baseConfig, [
        {
          name: Config.databasePortEnvVar,
          val: Config.defaultDatabasePort.toString(),
        },
      ]),
    );
    const defaultPgDatabaseConfig: Config = new Config(
      createEnv(baseConfig, [
        {
          name: Config.databaseNameEnvVar,
          val: Config.defaultDatabaseName,
        },
      ]),
    );
    const defaultPgPoolConnectionTimeoutMillisConfig: Config = new Config(
      createEnv(baseConfig, [
        {
          name: Config.databaseConnectionTimeoutMillisEnvVar,
          val: Config.defaultDatabaseConnectionTimeoutMillis.toString(),
        },
      ]),
    );
    const defaultPgPoolIdleTimeoutMillisConfig: Config = new Config(
      createEnv(baseConfig, [
        {
          name: Config.databaseIdleTimeoutMillisEnvVar,
          val: Config.defaultDatabaseIdleTimeoutMillis.toString(),
        },
      ]),
    );
    const defaultPgPoolMaxConfig: Config = new Config(
      createEnv(baseConfig, [
        {
          name: Config.databaseMaxClientCountEnvVar,
          val: Config.defaultDatabaseMaxClientCount.toString(),
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

    test('POSTGRES_PASSWORD missing | Throws AssertionError', () => {
      const env: NodeJS.ProcessEnv = createEnv(baseConfig);
      delete env[Config.databasePasswordEnvVar];

      expect(() => new Config(env)).toThrow(AssertionError);
    });

    test.each([
      {
        envVar: Config.databaseUserEnvVar,
        expected: defaultPgUserConfig,
      },
      {
        envVar: Config.databaseHostEnvVar,
        expected: defaultPgHostConfig,
      },
      {
        envVar: Config.databasePortEnvVar,
        expected: defaultPgPortConfig,
      },
      {
        envVar: Config.databaseNameEnvVar,
        expected: defaultPgDatabaseConfig,
      },
      {
        envVar: Config.databaseConnectionTimeoutMillisEnvVar,
        expected: defaultPgPoolConnectionTimeoutMillisConfig,
      },
      {
        envVar: Config.databaseIdleTimeoutMillisEnvVar,
        expected: defaultPgPoolIdleTimeoutMillisConfig,
      },
      {
        envVar: Config.databaseMaxClientCountEnvVar,
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
        envVar: Config.databasePortEnvVar,
        expected: defaultPgPortConfig,
      },
      {
        envVar: Config.databaseConnectionTimeoutMillisEnvVar,
        expected: defaultPgPoolConnectionTimeoutMillisConfig,
      },
      {
        envVar: Config.databaseIdleTimeoutMillisEnvVar,
        expected: defaultPgPoolIdleTimeoutMillisConfig,
      },
      {
        envVar: Config.databaseMaxClientCountEnvVar,
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
  env[Config.databasePasswordEnvVar] = config.databasePassword;
  env[Config.databaseUserEnvVar] = config.databaseUser;
  env[Config.databaseHostEnvVar] = config.databaseHost;
  env[Config.databasePortEnvVar] = config.databasePort.toString();
  env[Config.databaseNameEnvVar] = config.databaseName;
  env[Config.databaseConnectionTimeoutMillisEnvVar] =
    config.databaseConnectionTimeoutMillis.toString();
  env[Config.databaseIdleTimeoutMillisEnvVar] =
    config.databaseIdleTimeoutMillis.toString();
  env[Config.databaseMaxClientCountEnvVar] =
    config.databaseMaxClientCount.toString();
  env[Config.portEnvVar] = config.port.toString();
  env[Config.hashCostEnvVar] = config.hashCost.toString();
  env[Config.sessionExpireMillisEnvVar] = config.sessionExpireMillis.toString();

  for (const extra of extras) {
    env[extra.name] = extra.val;
  }

  return env;
}
