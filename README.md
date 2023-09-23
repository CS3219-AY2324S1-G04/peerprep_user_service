# PeerPrep User Service

Handles the storing and retrieving of user information.

The build script `build_image.sh` produces 2 docker images.
- `peerprep_user_service_database` - the database for storing user information.
- `peerprep_user_service_api` - the REST API for interacting with the database.

Note that when a `peerprep_user_service_database` container is created, a default admin account, with user name `admin`, is created as well.

## Table of Contents

- [PeerPrep User Service](#peerprep-user-service)
  - [Quickstart Guide](#quickstart-guide)
  - [Environment Variables](#environment-variables)
    - [Common](#common)
    - [Database](#database)
    - [API](#api)
  - [REST API](#rest-api)
    - [Register a User](#register-a-user)
    - [Login to a Session](#login-to-a-session)
    - [Logout of a Session](#logout-of-a-session)
    - [Get the User Profile](#get-the-user-profile)
    - [Update the User Profile](#update-the-user-profile)
    - [Delete a User](#delete-a-user)

## Quickstart Guide

1. Clone this repository.
2. Build the docker images by running: `./build_image.sh`
3. Modify the `.env` file as per needed. Refer to [Environment Variables](#environment-variables) for a list of configs. It is recommended that you modify `POSTGRES_PASSWORD` and `ADMIN_EMAIL`.
4. Create the docker containers by running: `docker compose up`

## Environment Variables

### Common

These environment variables are used by both the API and database images.

* `POSTGRES_PASSWORD` - Password of the database.
* `POSTGRES_USER` - User on the database host.
* `POSTGRES_DB` - Name of the database.
* `HASH_COST` - Cost factor of the password hashing algorithm.

### Database

* `ADMIN_EMAIL` - Email of the default admin user.
* `ADMIN_PASSWORD` - Password of the default admin user.

### API

* `PORT` - Port to listen on.
* `POSTGRES_PORT` - Port the database is listening on. This environment variable can be ignored if using docker compose.
* `POSTGRES_POOL_CONNECTION_TIMEOUT_MILLIS` - Number of milliseconds for a database client to connect to the database before timing out.
* `POSTGRES_POOL_IDLE_TIMEOUT_MILLIS` - Number of milliseconds a database client can remain idle for before being disconnected.
* `POSTGRES_POOL_MAX` - Max number of database clients.
* `SESSION_EXPIRE_MILLIS` - The number of milliseconds a login session can last for.

## REST API

### Register a User

> [POST] `/user_service/register`

Registers a new user.

**Parameters**

- `username` - Username.
- `email` - Email.
- `password` - Password.

**Response**

- `200` - Success.
- `400` - One or more query parameters are invalid. The reason for the error is provided in the response body.
  - Possible causes:
    - Username/Email/Password was not specified.
    - Username/Email/Password is of the wrong type.
    - Username/Email is already in use.
- `500` - Unexpected error occurred on the server.

### Login to a Session

> [POST] `/user_service/login`

Login to a new session.

**Parameters**

- `username` - Username.
- `password` - Password.

**Response**

- `200` - Success. A unique session token is stored in the response as a cookie with name "session_token".
- `400` - One or more query parameters are invalid. The reason for the error is provided in the response body.
  - Possible causes:
    - Username/Password was not specified.
    - Username/Password is of the wrong type.
- `401` - Username is not in use or the username and password do not match.
- `500` - Unexpected error occurred on the server.

### Logout of a Session

> [POST] `/user_service/logout`

Logout of the current session.

**Cookies**

- `session_token` - Session token.

**Response**

- `200` - Success.
- `401` - Session token was not provided or does not match any existing tokens.
- `500` - Unexpected error occurred on the server.

### Get the User Profile

> [GET] `/user_service/profile`

Gets the user's profile information.

**Cookies**

- `session_token` - Session token.

**Response**

- `200` - Success. User's profile information is stored as a JSON string in the response body.
- `401` - Session token was not provided or does not match any existing tokens.
- `500` - Unexpected error occurred on the server.

### Update the User Profile

> [POST] `/user_service/profile`

Updates the profile of the current user.

Note that all fields of the user profile must be provided including fields that have not been updated.

**Parameters**

- `username` - Updated username.
- `email` - Updated email.

**Cookies**

- `session_token` - Session token.

**Response**

- `200` - Success.
- `400` - One or more query parameters are invalid. The reason for the error is provided in the response body.
  - Possible causes:
    - Username/Email was not specified.
    - Username/Email is of the wrong type.
    - Username/Email is already in use.
- `401` - Session token was not provided or does not match any existing tokens.
- `500` - Unexpected error occurred on the server.


### Delete a User

> [DELETE] `/user_service/user`

Deletes the current user.

**Cookies**

- `session_token` - Session token.

**Response**

- `200` - Success.
- `401` - Session token was not provided or does not match any existing tokens.
- `500` - Unexpected error occurred on the server.
