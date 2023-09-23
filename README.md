# PeerPrep User Service

## REST API

### [POST] `/user_service/register`

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

### [POST] `/user_service/login`

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

### [POST] `/user_service/logout`

Logout of the current session.

**Cookies**

- `session_token` - Session token.

**Response**

- `200` - Success.
- `401` - Session token was not provided or does not match any existing tokens.
- `500` - Unexpected error occurred on the server.

### [GET] `/user_service/profile`

Gets the user's profile information.

**Cookies**

- `session_token` - Session token.

**Response**

- `200` - Success. User's profile information is stored as a JSON string in the response body.
- `401` - Session token was not provided or does not match any existing tokens.
- `500` - Unexpected error occurred on the server.

### [POST] `/user_service/profile`

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


### [DELETE] `/user_service/user`

Deletes the current user.

**Cookies**

- `session_token` - Session token.

**Response**

- `200` - Success.
- `401` - Session token was not provided or does not match any existing tokens.
- `500` - Unexpected error occurred on the server.
