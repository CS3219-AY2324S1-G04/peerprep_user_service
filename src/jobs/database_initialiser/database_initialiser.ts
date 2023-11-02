/**
 * @file Initialises the database.
 */
import DatabaseConfig from '../../configs/database_config';
import PasswordHash from '../../data_structs/password_hash';
import UserId from '../../data_structs/user_id';
import Username from '../../data_structs/username';
import UserRole from '../../enums/user_role';
import DatabaseClient from '../../service/database_client';
import { PostgresDatabaseClient } from '../../service/postgres_database_client';
import DatabaseInitialiserConfig from './database_initialiser_config';

const databaseConfig: DatabaseConfig = new DatabaseConfig();
const databaseInitialiserConfig: DatabaseInitialiserConfig =
  new DatabaseInitialiserConfig();

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

client.initialise().then(async () => {
  if (await client.doEntitiesExist()) {
    console.log('One or more entities to be created already exist.');

    if (databaseInitialiserConfig.shouldForceInitialisation) {
      console.log('Deleting existing entities ...');
      await client.deleteEntities();
      console.log('Deleted existing entities!');
    } else {
      console.log('Initialisation aborted!');
      await client.disconnect();
      return;
    }
  }

  console.log('Creating entities ...');

  await client.synchronise();

  console.log('Created entities!');
  console.log('Creating admin user ...');

  await client.createUserProfileAndCredential(
    {
      username: Username.parse('admin'),
      emailAddress: databaseInitialiserConfig.adminEmailAddress,
    },
    await PasswordHash.hash(
      databaseInitialiserConfig.adminPassword,
      databaseConfig.hashCost,
    ),
  );
  await client.updateUserRole(UserId.parseNumber(1), UserRole.admin);

  console.log('Created admin user!');

  await client.disconnect();
});
