/**
 * @file Entrypoint to the REST API app.
 *
 * The REST API app handles REST API requests sent to it's endpoints.
 */
import App from './app';
import ApiConfig from './configs/api_config';
import CoreConfig from './configs/core_config';
import DatabaseClientConfig from './configs/database_client_config';
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

const coreConfig: CoreConfig = new CoreConfig();
const databaseClientConfig: DatabaseClientConfig = new DatabaseClientConfig();
const apiConfig: ApiConfig = new ApiConfig();

const client: DatabaseClient = new PostgresDatabaseClient(databaseClientConfig);

const app: App = new App(
  apiConfig.port,
  client,
  [
    new CreateUserHandler(coreConfig.hashCost),
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
    new UpdatePasswordHandler(coreConfig.hashCost),
    new UpdateUserRoleHandler(),
    new DeleteUserHandler(),
    new GetAccessTokenPublicKeyHandler(apiConfig.accessTokenPublicKey),
    new GetUserIdentityHandler(),
  ],
  apiConfig.isDevEnv,
);

client.initialise().then(() => app.start());
