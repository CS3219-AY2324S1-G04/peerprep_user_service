/**
 * @file Entrypoint to the app.
 */
import pg from 'pg';

import App from './app';
import Config from './data_structs/config';
import DeleteUserHandler from './handlers/delete_user_handler';
import GetUserIdentityHandler from './handlers/get_user_identity_handler';
import GetUserProfileHandler from './handlers/get_user_profile_handler';
import LoginHandler from './handlers/login_handler';
import LogoutHandler from './handlers/logout_handler';
import RegisterHandler from './handlers/register_handler';
import UpdateUserProfileHandler from './handlers/update_user_profile_handler';

const config: Config = new Config();
const pgPool: pg.Pool = new pg.Pool({
  password: config.pgPassword,
  user: config.pgUser,
  host: config.pgHost,
  port: config.pgPort,
  database: config.pgDatabase,
  connectionTimeoutMillis: config.pgPoolConnectionTimeoutMillis,
  idleTimeoutMillis: config.pgPoolIdleTimeoutMillis,
});

// TODO: Change password
// TODO: Change user role
const app: App = new App(config.port, pgPool, [
  new RegisterHandler(config.hashCost),
  new LoginHandler(config.sessionExpireMillis),
  new LogoutHandler(),
  new GetUserProfileHandler(),
  new UpdateUserProfileHandler(),
  new DeleteUserHandler(),
  new GetUserIdentityHandler(),
]);

app.start();
