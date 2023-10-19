# PeerPrep User Service

Handles the storing and retrieving of user information.

The build script `build_image.sh` produces 2 docker images.
- `peerprep_user_service_database` - Database for storing user information.
- `peerprep_user_service_api` - REST API for interacting with the database.

Note that when a `peerprep_user_service_database` container is created, a default PeerPrep admin user account, with user name `admin`, is created as well.

## Table of Contents

- [Quickstart Guide](#quickstart-guide)
- [Environment Variables](#environment-variables)
  - [API](#api)
  - [Database](#database)
  - [Docker Compose](#docker-compose)
- [REST API](#rest-api)
  - [Create a User](#create-a-user)
  - [Create a Session](#create-a-session)
  - [Delete a Session \[via Session Token\]](#delete-a-session-via-session-token)
  - [Get a User Profile \[via Session Token\]](#get-a-user-profile-via-session-token)
  - [Update a User Profile \[via Session Token\]](#update-a-user-profile-via-session-token)
  - [Update a User's Password \[via Session Token\]](#update-a-users-password-via-session-token)
  - [Update a User's Role](#update-a-users-role)
  - [Delete a User \[via Session Token\]](#delete-a-user-via-session-token)
  - [Get a User Identity \[via Session Token\]](#get-a-user-identity-via-session-token)
- [To Do](#to-do)

## Quickstart Guide

1. Clone this repository.
2. Build the docker images by running: `./build_image.sh`
3. Modify the `.env` file as per needed. Refer to [Environment Variables](#environment-variables) for a list of configs. It is recommended that you modify `DATABASE_PASSWORD` and `ADMIN_EMAIL_ADDRESS`.
4. Create the docker containers by running: `docker compose up`

## Environment Variables

### API

- `DATABASE_HOST` - Address of the database host.
- `DATABASE_PASSWORD` - Password of the database.
- `DATABASE_USER` - User on the database host.
- `DATABASE_NAME` - Name of the database.
- `DATABASE_PORT` - Port the database is listening on.
- `DATABASE_CONNECTION_TIMEOUT_MILLIS` - Number of milliseconds for a database client to connect to the database before timing out.
- `DATABASE_IDLE_TIMEOUT_MILLIS` - Number of milliseconds a database client can remain idle for before being disconnected.
- `DATABASE_MAX_CLIENT_COUNT` - Max number of database clients.
- `PORT` - Port to listen on.
- `HASH_COST` - Cost factor of the password hashing algorithm.
- `SESSION_EXPIRE_MILLIS` - Number of milliseconds a login session can last for.
- `NODE_ENV` - Sets the mode the app is running in ("development" or "production")

### Database

- `POSTGRES_PASSWORD` - Password of the database.
- `POSTGRES_USER` - User on the database host.
- `POSTGRES_DB` - Name of the database.
- `ADMIN_EMAIL_ADDRESS` - Email address of the default PeerPrep admin user.
- `ADMIN_PASSWORD` - Password of the default PeerPrep admin user.
- `HASH_COST` - Cost factor of the password hashing algorithm.

### Docker Compose

The following describe how certain environment variables in ".env" are used:
- `DATABASE_PASSWORD` - Value is used for API's `DATABASE_PASSWORD` and database's `POSTGRES_PASSWORD`
- `DATABASE_USER` - Value is used for API's `DATABASE_USER` and database's `POSTGRES_USER`
- `DATABASE_NAME` - Value is used for API's `DATABASE_NAME` and database's `POSTGRES_DB`

## REST API

### Create a User

> [POST] `/user-service/users`

Creates a new user.

**Query Parameters**

- `username` - Username.
- `email-address` - Email address.
- `password` - Password.

**Response**

- `200` - Success.
- `400` - One or more query parameters are invalid. The reason for the error is provided in the response body.
  - Example response body:
    ```json
    {
      "username": "Username cannot be empty.",
      "email-address": "Email address cannot be empty.",
      "password": "Password cannot be empty."
    }
    ```
- `500` - Unexpected error occurred on the server.

### Create a Session

> [POST] `/user-service/sessions`

Creates a new user session.

**Query Parameters**

- `username` - Username.
- `password` - Password.

**Response**

- `200` - Success. A unique session token is stored in the response as a cookie with name "session-token".
- `400` - One or more query parameters are invalid. The reason for the error is provided in the response body.
  - Example response body:
    ```json
    {
      "username": "Username cannot be empty.",
      "password": "Password cannot be empty."
    }
    ```
- `401` - Username is not in use or the username and password do not match.
- `500` - Unexpected error occurred on the server.

### Delete a Session [via Session Token]

> [DELETE] `/user-service/session`

Deletes the session whose session token is the one specified.

**Cookies**

- `session-token` - Session token.

**Response**

- `200` - Success.
- `401` - Session token was not provided or does not match any existing session tokens.
- `500` - Unexpected error occurred on the server.

### Get a User Profile [via Session Token]

> [GET] `/user-service/user/profile`

Gets the profile of the user who owns the specified session token.

**Cookies**

- `session-token` - Session token.

**Response**

- `200` - Success. User's profile information is stored as a JSON string in the response body.
  - Example response body:
    ```json
    {
      "username": "foo",
      "email-address": "foo@bar.com",
      "user-id": 2,
      "user-role": "user"
    }
    ```
- `401` - Session token was not provided or does not match any existing session tokens.
- `500` - Unexpected error occurred on the server.

### Update a User Profile [via Session Token]

> [PUT] `/user-service/user/profile`

Updates the profile of the user who owns the specified session token.

Note that all fields of the user profile must be provided including fields that have not been updated.

**Query Parameters**

- `username` - Updated username.
- `email-address` - Updated email address.

**Cookies**

- `session-token` - Session token.

**Response**

- `200` - Success.
- `400` - One or more query parameters are invalid. The reason for the error is provided in the response body.
  - Example response body:
    ```json
    {
      "username": "Username cannot be empty.",
      "email-address": "Email address cannot be empty."
    }
    ```
- `401` - Session token was not provided or does not match any existing session tokens.
- `500` - Unexpected error occurred on the server.

### Update a User's Password [via Session Token]

> [PUT] `/user-service/user/password`

Updates the password of the user who owns the specified session token.

Since this is a high threat operation, the user must verify their identity by providing their current password.

**Query Parameters**

- `password` - Password for verifying the user.
- `new-password` - New password to update to.

**Cookies**

- `session-token` - Session token.

**Response**

- `200` - Success.
- `400` - New password is not a valid password. The reason for the invalidity is provided in the response body.
  - Example response body:
    ```json
    {
      "new-password": "Password cannot be empty."
    }
    ```
- `401` - Session token was not provided, or does not match any existing session tokens, or password is incorrect.
- `500` - Unexpected error occurred on the server.

### Update a User's Role

> [PUT] `/user-service/users/:user-id/user-role`

Updates the user role of a user.

The user making the request must have the "admin" user role.

**Path Parameters**

- `user-id` - User ID of the user whose user role is to be updated.

**Query Parameters**

- `user-role` - Updated user role.

**Cookies**

- `session-token` - Session token of the user making the request.

**Response**

- `200` - Success.
- `400` - One or more query parameters are invalid. The reason for the error is provided in the response body.
  - Example response body:
    ```json
    {
      "user-role": "User role is invalid."
    }
    ```
- `401` - Session token was not provided, or does not match any existing session tokens, or does not belong to a user with the "admin" user role.
- `404` - User ID does not belong to any existing user.
- `500` - Unexpected error occurred on the server.

### Delete a User [via Session Token]

> [DELETE] `/user-service/user`

Deletes the user who owns the specified session token.

Since this is a high threat operation, the user must verify their identity by providing their password.

**Query Parameters**

- `password` - Password for verifying the user.

**Cookies**

- `session-token` - Session token.

**Response**

- `200` - Success.
- `401` - Session token was not provided, or does not match any existing session tokens, or password is incorrect.
- `500` - Unexpected error occurred on the server.

### Get a User Identity [via Session Token]

> [GET] `/user-service/user/identity`

Gets the user ID and user role of the user who owns the specified session token.

This is similar to [Get a User Profile \[via Session Token\]](#get-a-user-profile-via-session-token) but sends less information and allows the session token to be specified via a query parameter. It is mainly to be use by other services to determine the existence and user role of a user.

**Query Parameters**

- `session-token` - Session token. This is preferred if the HTTP request is made from another service. If specified, there is no need to specify it again in the request cookie.

**Cookies**

- `session-token` - Session token. This is only to be use if the HTTP request is made from a browser. If specified, there is no need to specify it again in the request query parameter.

**Response**

- `200` - Success. User ID and user role are stored in the response body.
  - `user-role` can have the value `admin`, `maintainer`, or `user`
  - Example response body:
    ```json
    {
      "user-id": 2,
      "user-role": "user"
    }
    ```
- `401` - Session token was not provided or does not match any existing session tokens.
- `500` - Unexpected error occurred on the server.

## To Do
- Extend session token expiry whenever session token is used
- Sync frontend and backend parameter value validation
- Set session token to be secure
- API for validating session token
- API for changing password
- API for listing users if user role is admin
- API for password recovery
