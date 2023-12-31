/**
 * @file Entrypoint to the database initialiser.
 *
 * The database initialiser creates the necessary entities in the database and
 * also creates default Peerprep admin account.
 */
import CoreConfig from '../../configs/core_config';
import DatabaseClientConfig from '../../configs/database_client_config';
import PasswordHash from '../../data_structs/password_hash';
import UserId from '../../data_structs/user_id';
import Username from '../../data_structs/username';
import UserRole from '../../enums/user_role';
import DatabaseClient from '../../service/database_client';
import { PostgresDatabaseClient } from '../../service/postgres_database_client';
import DatabaseInitialiserConfig from './database_initialiser_config';

const coreConfig: CoreConfig = new CoreConfig();
const databaseClientConfig: DatabaseClientConfig = new DatabaseClientConfig();
const databaseInitialiserConfig: DatabaseInitialiserConfig =
  new DatabaseInitialiserConfig();

const client: DatabaseClient = new PostgresDatabaseClient(databaseClientConfig);

async function initialise(): Promise<void> {
  await client.initialise();

  if (await client.doEntitiesExist()) {
    console.log('One or more entities to be created already exist.');

    if (!databaseInitialiserConfig.shouldForceInitialisation) {
      console.log('Initialisation aborted!');
      await client.disconnect();
      return;
    }

    await deleteExistingEntities();
  }

  await createEntities();
  await createAdminUser();

  await client.disconnect();
}

async function deleteExistingEntities(): Promise<void> {
  console.log('Deleting existing entities ...');
  await client.deleteEntities();
  console.log('Deleted existing entities!');
}

async function createEntities(): Promise<void> {
  console.log('Creating entities ...');
  await client.synchronise();
  console.log('Created entities!');
}

async function createAdminUser(): Promise<void> {
  console.log('Creating admin user ...');

  await client.createUserProfileAndCredential(
    {
      username: Username.parse('admin'),
      emailAddress: databaseInitialiserConfig.adminEmailAddress,
    },
    await PasswordHash.hash(
      databaseInitialiserConfig.adminPassword,
      coreConfig.hashCost,
    ),
  );
  await client.updateUserRole(UserId.parseNumber(1), UserRole.admin);

  console.log('Created admin user!');
}

initialise();
