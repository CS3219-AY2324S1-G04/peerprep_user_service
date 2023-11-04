# PeerPrep User Service

Handles the storing and retrieving of user information.

## Table of Contents

- [Quickstart Guide](#quickstart-guide)
- [Build Script](#build-script)
- [Docker Images](#docker-images)
  - [API](#api)
  - [Database Initialiser](#database-initialiser)
- [REST API](#rest-api)
  - [Create a User](#create-a-user)
  - [Create a Session](#create-a-session)
  - [Get an Access Token](#get-an-access-token)
  - [Delete a Session](#delete-a-session)
  - [Get a User Profile](#get-a-user-profile)
  - [Update a User Profile](#update-a-user-profile)
  - [Update a User's Password](#update-a-users-password)
  - [Update a User's Role](#update-a-users-role)
  - [Delete a User](#delete-a-user)
  - [Get Access Token Public Key](#get-access-token-public-key)
  - [Get a User Identity](#get-a-user-identity)
- [To Do](#to-do)

## Quickstart Guide

1. Clone this repository.
2. Build the docker images by running: `./build_images.sh`
3. Modify the ".env" file as per needed. Refer to [Docker Images](#docker-images) for the list of environment variables.
4. Create the docker containers by running: `docker compose up`

## Build Script

`build_images.sh` is a build script for building the Docker images and optionally pushing them to the container registry. To get more information about the script, run:

```
./build_images.sh -h
```

## Docker Images

### API

**Name:** ghcr.io/cs3219-ay2324s1-g04/peerprep_user_service_api

**Description:** This docker image contains the REST API.

**Environment Variables:**

- `DATABASE_USER` - User on the database host.
- `DATABASE_PASSWORD` - Password of the database.
- `DATABASE_HOST` - Address of the database host. (no need to specify if using "compose.yaml")
- `DATABASE_PORT` - Port the database is listening on. (no need to specify if using "compose.yaml")
- `DATABASE_NAME` - Name of the database.
- `DATABASE_CONNECTION_TIMEOUT_MILLIS` - Number of milliseconds for a database client to connect to the database before timing out.
- `DATABASE_MAX_CLIENT_COUNT` - Max number of database clients.
- `HASH_COST` - Cost factor of the password hashing algorithm.
- `ACCESS_TOKEN_PRIVATE_KEY` - Private key for signing access tokens.
- `ACCESS_TOKEN_PUBLIC_KEY` - Public key for verifying access tokens.
- `SESSION_EXPIRE_MILLIS` - Number of milliseconds a user session can live for since the last expiry date and time extension.
- `ACCESS_TOKEN_EXPIRE_MILLIS` - Number of milliseconds an access token can live for.
- `PORT` - Port to listen on.
- `NODE_ENV` - Sets the mode the app is running in ("development" or "production")

### Database Initialiser

**Name:** ghcr.io/cs3219-ay2324s1-g04/peerprep_user_service_database_initialiser

**Description:** This docker image initialises the database by creating the necessary entities and a default Peerprep admin account.

**Environment Variables:**

- `DATABASE_USER` - User on the database host.
- `DATABASE_PASSWORD` - Password of the database.
- `DATABASE_HOST` - Address of the database host. (no need to specify if using "compose.yaml")
- `DATABASE_PORT` - Port the database is listening on. (no need to specify if using "compose.yaml")
- `DATABASE_NAME` - Name of the database.
- `DATABASE_CONNECTION_TIMEOUT_MILLIS` - Number of milliseconds for a database client to connect to the database before timing out.
- `DATABASE_MAX_CLIENT_COUNT` - Max number of database clients.
- `HASH_COST` - Cost factor of the password hashing algorithm.
- `ADMIN_EMAIL_ADDRESS` - Email address of the default PeerPrep admin user.
- `ADMIN_PASSWORD` - Password of the default PeerPrep admin user.
- `SHOULD_FORCE_INITIALISATION` - Set to "true" if initialisation should be done even if entities already exist. Do not set to "true" in production as it might cause loss of data.

## REST API

### Create a User

> [POST] `/user-service/users`

Creates a new user.

**Query Parameters**

- `username` - Username.
- `email-address` - Email address.
- `password` - Password.

**Response**

- `201` - User created.
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

- `201` - Session created. The response will contain 3 cookies, a session token cookie named "session-token", an access token cookie named "access-token", and a cookie for the expiry of the access token named "access-token-expiry". The access token expiry cookie is the only cookie that is not HTTP-only.
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

### Get an Access Token

> [GET] `/user-service/session/access-token`

Gets an access token for the user who owns the specified session token.

A successful request to this endpoint will also extend the expiry of the session whose session token was specified.

**Cookies**

- `session-token` - Session token.

**Response**

- `200` - Success. The response will contain 3 cookies, a session token cookie named "session-token", an access token cookie named "access-token", and a cookie for the expiry of the access token named "access-token-expiry". The session token cookie is sent to extend the lifespan of the cookie on the browser. The access token expiry cookie is the only cookie that is not HTTP-only.
- `401` - Session token was not provided or is invalid.
- `500` - Unexpected error occurred on the server.

### Delete a Session

> [DELETE] `/user-service/session`

Deletes the session whose session token is the one specified.

**Cookies**

- `session-token` - Session token.

**Response**

- `200` - Success. The response will contain 3 expired cookies, a session token cookie named "session-token", an access token cookie named "access-token", and a cookie for the expiry of the access token named "access-token-expiry".
- `401` - Session token was not provided or is invalid.
- `500` - Unexpected error occurred on the server.

### Get a User Profile

> [GET] `/user-service/user/profile`

Gets the profile of the user who owns the specified access token.

**Cookies**

- `access-token` - Access token.

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
- `401` - Access token was not provided or is invalid.
- `500` - Unexpected error occurred on the server.

### Update a User Profile

> [PUT] `/user-service/user/profile`

Updates the profile of the user who owns the specified session token.

Since this is a high threat operation, the user must provide their session token.

Note that all fields of the user profile must be provided including fields that have not been updated.

**Query Parameters**

- `username` - Updated username.
- `email-address` - Updated email address.

**Cookies**

- `session-token` - Session token.

**Response**

- `200` - Success. The response will contain 2 cookies, an access token cookie named "access-token", and a cookie for the expiry of the access token named "access-token-expiry". The access token expiry cookie is the only cookie that is not HTTP-only.
- `400` - One or more query parameters are invalid. The reason for the error is provided in the response body.
  - Example response body:
    ```json
    {
      "username": "Username cannot be empty.",
      "email-address": "Email address cannot be empty."
    }
    ```
- `401` - Access token was not provided or is invalid.
- `500` - Unexpected error occurred on the server.

### Update a User's Password

> [PUT] `/user-service/user/password`

Updates the password of the user who owns the specified session token.

Since this is a high threat operation, the user must provide their session token and also their current password.

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
- `401` - Session token was not provided, or session token is invalid, or password is incorrect.
- `500` - Unexpected error occurred on the server.

### Update a User's Role

> [PUT] `/user-service/users/:user-id/user-role`

Updates the user role of a user.

The user making the request must have the "admin" user role. Since this is a high threat operation, the user must provide their session token.

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
- `401` - Session token was not provided, or is invalid, or does not belong to a user with the "admin" user role.
- `404` - User ID does not belong to any existing user.
- `500` - Unexpected error occurred on the server.

### Delete a User

> [DELETE] `/user-service/user`

Deletes the user who owns the specified session token.

Since this is a high threat operation, the user must provide their session token and also their password.

**Query Parameters**

- `password` - Password for verifying the user.

**Cookies**

- `session-token` - Session token.

**Response**

- `200` - Success. The response will contain 3 expired cookies, a session token cookie named "session-token", an access token cookie named "access-token", and a cookie for the expiry of the access token named "access-token-expiry".
- `401` - Session token was not provided, or session token is invalid, or password is incorrect.
- `500` - Unexpected error occurred on the server.

### Get Access Token Public Key

> [GET] `/user-service/access-token-public-key`

Gets the public key for verifying access tokens.

**Response**

- `200` - Success. The response body will contain the public key.
- `500` - Unexpected error occurred on the server.

### Get a User Identity

> [GET] `/user-service/user/identity`

Gets the user ID and user role of the user who owns the specified session token.

This is only intended to be used by other services when performing high threat model operations, where trusting the information stored in a valid access token is risky.

**Query Parameters**

- `session-token` - Session token.

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
- `401` - Session token was not provided or is invalid.
- `500` - Unexpected error occurred on the server.

## To Do
- Sync frontend and backend parameter value validation
- Set session token to be secure
- API for listing users if user role is admin
- API for password recovery
