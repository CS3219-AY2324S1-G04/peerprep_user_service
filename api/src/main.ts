/**
 * @file Entrypoint to the app.
 */
import pg from 'pg';

import Config from './data/config';
import App from './services/app';
import DeleteUserHandler from './services/handlers/delete_user_handler';
import GetUserProfileHandler from './services/handlers/get_user_profile_handler';
import LoginHandler from './services/handlers/login_handler';
import LogoutHandler from './services/handlers/logout_handler';
import RegisterHandler from './services/handlers/register_handler';
import UpdateUserProfileHandler from './services/handlers/update_user_profile_handler';

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

// TODO: Admin account
// TODO: Change password
const app: App = new App(config.port, pgPool, [
  new RegisterHandler(config.hashCost),
  new LoginHandler(config.sessionExpireMillis),
  new LogoutHandler(),
  new GetUserProfileHandler(),
  new UpdateUserProfileHandler(),
  new DeleteUserHandler(),
]);

app.start();
