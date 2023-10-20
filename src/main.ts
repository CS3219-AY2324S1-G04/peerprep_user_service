/**
 * @file Entrypoint to the API app.
 */
import App from './app';
import ApiConfig from './configs/api_config';
import DatabaseConfig from './configs/database_config';
import DeleteUserHandler from './handlers/delete_user_handler';
import GetUserIdentityHandler from './handlers/get_user_identity_handler';
import GetUserProfileHandler from './handlers/get_user_profile_handler';
import LoginHandler from './handlers/login_handler';
import LogoutHandler from './handlers/logout_handler';
import RegisterHandler from './handlers/register_handler';
import UpdatePasswordHandler from './handlers/update_password_handler';
import UpdateUserProfileHandler from './handlers/update_user_profile_handler';
import UpdateUserRoleHandler from './handlers/update_user_role_handler';
import DatabaseClient from './service/database_client';
import { PostgresDatabaseClient } from './service/postgres_database_client';

const databaseConfig: DatabaseConfig = new DatabaseConfig();
const apiConfig: ApiConfig = new ApiConfig();
const client: DatabaseClient = new PostgresDatabaseClient({
  password: databaseConfig.databasePassword,
  user: databaseConfig.databaseUser,
  host: databaseConfig.databaseHost,
  port: databaseConfig.databasePort,
  databaseName: databaseConfig.databaseName,
  connectionTimeoutMillis: databaseConfig.databaseConnectionTimeoutMillis,
  idleTimeoutMillis: databaseConfig.databaseIdleTimeoutMillis,
  maxClientCount: databaseConfig.databaseMaxClientCount,
});

const app: App = new App(
  apiConfig.port,
  client,
  [
    new RegisterHandler(databaseConfig.hashCost),
    new LoginHandler(apiConfig.sessionExpireMillis),
    new LogoutHandler(),
    new GetUserProfileHandler(),
    new UpdateUserProfileHandler(),
    new UpdatePasswordHandler(databaseConfig.hashCost),
    new UpdateUserRoleHandler(),
    new DeleteUserHandler(),
    new GetUserIdentityHandler(),
  ],
  apiConfig.isDevEnv,
);

client.initialise().then(() => app.start());
