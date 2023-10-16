# PeerPrep User Service

Handles the storing and retrieving of user information.

The build script `build_image.sh` produces 2 docker images.
- `peerprep_user_service_database` - Database for storing user information.
- `peerprep_user_service_api` - REST API for interacting with the database.

Note that when a `peerprep_user_service_database` container is created, a default PeerPrep admin user account, with user name `admin`, is created as well.

## Table of Contents

- [PeerPrep User Service](#peerprep-user-service)
  - [Quickstart Guide](#quickstart-guide)
  - [Environment Variables](#environment-variables)
    - [Common](#common)
    - [Database](#database)
    - [API](#api)
  - [REST API](#rest-api)
    - [Create a User](#create-a-user)
    - [Create a Session](#create-a-session)
    - [Delete a Session \[via Session Token\]](#delete-a-session-via-session-token)
    - [Get a User Profile \[via Session Token\]](#get-a-user-profile-via-session-token)
    - [Update a User Profile \[via Session Token\]](#update-a-user-profile-via-session-token)
    - [Update a User's Role](#update-a-users-role)
    - [Delete a User \[via Session Token\]](#delete-a-user-via-session-token)
    - [Get a User Identity \[via Session Token\]](#get-a-user-identity-via-session-token)
  - [To Do](#to-do)

## Quickstart Guide

1. Clone this repository.
2. Build the docker images by running: `./build_image.sh`
3. Modify the `.env` file as per needed. Refer to [Environment Variables](#environment-variables) for a list of configs. It is recommended that you modify `DATABASE_PASSWORD` and `ADMIN_EMAIL`.
4. Create the docker containers by running: `docker compose up`

## Environment Variables

### Common

These environment variables are used by both the API and database images.

* `DATABASE_PASSWORD` - Password of the database.
* `DATABASE_USER` - User on the database host.
* `DATABASE_NAME` - Name of the database.
* `HASH_COST` - Cost factor of the password hashing algorithm.

### Database

* `ADMIN_EMAIL` - Email of the default PeerPrep admin user.
* `ADMIN_PASSWORD` - Password of the default PeerPrep admin user.

### API

* `PORT` - Port to listen on.
* `DATABASE_PORT` - Port the database is listening on. This environment variable can be ignored if using docker compose.
* `DATABASE_CONNECTION_TIMEOUT_MILLIS` - Number of milliseconds for a database client to connect to the database before timing out.
* `DATABASE_IDLE_TIMEOUT_MILLIS` - Number of milliseconds a database client can remain idle for before being disconnected.
* `DATABASE_MAX_CLIENT_COUNT` - Max number of database clients.
* `SESSION_EXPIRE_MILLIS` - The number of milliseconds a login session can last for.

## REST API

### Create a User

> [POST] `/user-service/users`

Creates a new user.

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

### Create a Session

> [POST] `/user-service/sessions`

Creates a new user session.

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

### Delete a Session [via Session Token]

> [DELETE] `/user-service/session`

Deletes the session whose token is the specified.

**Cookies**

- `session_token` - Session token.

**Response**

- `200` - Success.
- `401` - Session token was not provided or does not match any existing tokens.
- `500` - Unexpected error occurred on the server.

### Get a User Profile [via Session Token]

> [GET] `/user-service/user/profile`

Gets the profile of the user who owns the specified session token.

**Cookies**

- `session_token` - Session token.

**Response**

- `200` - Success. User's profile information is stored as a JSON string in the response body.
  - Example response body:
    ```json
    {
      "userId": 2,
      "role": "user",
      "username": "foo",
      "email": "foo@example.com"
    }
    ```
- `401` - Session token was not provided or does not match any existing tokens.
- `500` - Unexpected error occurred on the server.

### Update a User Profile [via Session Token]

> [PUT] `/user-service/user/profile`

Updates the profile of the user who owns the specified session token.

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

### Update a User's Role

> [PUT] `/user-service/users/:userId/role`

Updates the role of a user.

The user making the request must have the "admin" role.

**Path Parameters**

- `userId` - ID of the user whose role is to be updated.

**Query Parameters**

- `role` - Updated role.

**Cookies**

- `session_token` - Session token of the user making the request.

**Response**

- `200` - Success.
- `400` - One or more query parameters are invalid. The reason for the error is provided in the response body.
  - Possible causes:
    - ID/Role was not specified.
    - ID/Role is of the wrong type.
    - Role does not match any of the possible user roles.
- `401` - Session token was not provided, or does not match any existing tokens, or does not belong to a user with the "admin" role.
- `404` - ID does not belong to any existing user.
- `500` - Unexpected error occurred on the server.

### Delete a User [via Session Token]

> [DELETE] `/user-service/user`

Deletes the user who owns the specified session token.

**Cookies**

- `session_token` - Session token.

**Response**

- `200` - Success.
- `401` - Session token was not provided or does not match any existing tokens.
- `500` - Unexpected error occurred on the server.

### Get a User Identity [via Session Token]

> [GET] `/user-service/user/identity`

Gets the ID and role of the user who owns the specified session token.

This is similar to [Get a User Profile \[via Session Token\]](#get-a-user-profile-via-session-token) but sends less information and allows the session token to be specified via a query parameter. It is mainly to be use by other services to determine the existence and role of a user. It can also be use by the frontend to determine the role of a user when other user profile information is unnecessary.

**Parameters**

- `session_token` - Session token. This is preferred if the HTTP request is made from another service. If specified, there is no need to specify it again in the request cookie.

**Cookies**

- `session_token` - Session token. This is only to be use if the HTTP request is made from a browser. If specified, there is no need to specify it again in the request query parameter.

**Response**

- `200` - Success. User's ID and role is stored as a JSON string in the response body.
  - `userId` can have the value `admin`, `maintainer`, or `user`
  - Example response body:
    ```json
    {
      "userId": 2,
      "role": "user"
    }
    ```
- `401` - Session token was not provided or does not match any existing tokens.
- `500` - Unexpected error occurred on the server.

## To Do
- Extend session token expiry whenever token is used
- Limit character set for username
- Set session token to be secure
- API for validating token
- API for changing password
- API for listing users if user role is admin
- API for password recovery
