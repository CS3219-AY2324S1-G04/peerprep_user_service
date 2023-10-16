CREATE TYPE user_role AS ENUM ('admin', 'maintainer', 'user');

CREATE TABLE user_profile (
  user_id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email_address TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'user'
);

CREATE TABLE user_credential (
  user_id INTEGER PRIMARY KEY REFERENCES user_profile ON DELETE CASCADE ON UPDATE CASCADE,
  password_hash CHAR(60) NOT NULL
);

CREATE TABLE user_session (
  session_token CHAR(36) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES user_profile ON DELETE CASCADE ON UPDATE CASCADE,
  login_time TIMESTAMP NOT NULL DEFAULT now(),
  session_expiry TIMESTAMP NOT NULL
);
