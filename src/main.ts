/**
 * @file Entrypoint to the API app.
 */
import App from './app';
import ApiConfig from './configs/api_config';
import DatabaseConfig from './configs/database_config';
import CreateSessionHandler from './handlers/create_session_handler';
import CreateUserHandler from './handlers/create_user_handler';
import DeleteSessionHandler from './handlers/delete_session_handler';
import DeleteUserHandler from './handlers/delete_user_handler';
import GetAccessTokenHandler from './handlers/get_access_token_handler';
import GetAccessTokenPublicKeyHandler from './handlers/get_access_token_public_key_handler';
import GetUserIdentityHandler from './handlers/get_user_identity_handler';
import GetUserProfileHandler from './handlers/get_user_profile_handler';
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
  maxClientCount: databaseConfig.databaseMaxClientCount,
});

const app: App = new App(
  apiConfig.port,
  client,
  [
    new CreateUserHandler(databaseConfig.hashCost),
    new CreateSessionHandler(
      apiConfig.accessTokenPrivateKey,
      apiConfig.sessionExpireMillis,
      apiConfig.accessTokenExpireMillis,
    ),
    new GetAccessTokenHandler(
      apiConfig.accessTokenPrivateKey,
      apiConfig.sessionExpireMillis,
      apiConfig.accessTokenExpireMillis,
    ),
    new DeleteSessionHandler(),
    new GetUserProfileHandler(apiConfig.accessTokenPublicKey),
    new UpdateUserProfileHandler(
      apiConfig.accessTokenPrivateKey,
      apiConfig.accessTokenExpireMillis,
    ),
    new UpdatePasswordHandler(databaseConfig.hashCost),
    new UpdateUserRoleHandler(),
    new DeleteUserHandler(),
    new GetAccessTokenPublicKeyHandler(apiConfig.accessTokenPublicKey),
    new GetUserIdentityHandler(),
  ],
  apiConfig.isDevEnv,
);

client.initialise().then(() => app.start());
