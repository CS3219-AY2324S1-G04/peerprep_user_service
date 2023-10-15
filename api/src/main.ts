/**
 * @file Entrypoint to the app.
 */
import App from './app';
import Config from './data_structs/config';
import DeleteUserHandler from './handlers/delete_user_handler';
import GetUserIdentityHandler from './handlers/get_user_identity_handler';
import GetUserProfileHandler from './handlers/get_user_profile_handler';
import LoginHandler from './handlers/login_handler';
import LogoutHandler from './handlers/logout_handler';
import RegisterHandler from './handlers/register_handler';
import UpdateUserProfileHandler from './handlers/update_user_profile_handler';
import UpdateUserRoleHandler from './handlers/update_user_role_handler';
import DatabaseClient from './service/database_client';
import { PgDatabaseClient } from './service/pg_database_client';

const config: Config = new Config();
const client: DatabaseClient = new PgDatabaseClient({
  password: config.databasePassword,
  user: config.databaseUser,
  host: config.databaseHost,
  port: config.databasePort,
  databaseName: config.databaseName,
  connectionTimeoutMillis: config.databaseConnectionTimeoutMillis,
  idleTimeoutMillis: config.databaseIdleTimeoutMillis,
  maxClientCount: config.databaseMaxClientCount,
});

const app: App = new App(config.port, client, [
  new RegisterHandler(config.hashCost),
  new LoginHandler(config.sessionExpireMillis),
  new LogoutHandler(),
  new GetUserProfileHandler(),
  new UpdateUserProfileHandler(),
  new UpdateUserRoleHandler(),
  new DeleteUserHandler(),
  new GetUserIdentityHandler(),
]);

client.initialise().then(() => app.start());
