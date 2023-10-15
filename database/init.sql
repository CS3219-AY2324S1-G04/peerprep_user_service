CREATE TYPE user_role AS ENUM ('admin', 'maintainer', 'user');

CREATE TABLE user_profile (
  user_id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'user'
);

CREATE TABLE user_credential (
  user_id INTEGER PRIMARY KEY REFERENCES user_profile ON DELETE CASCADE ON UPDATE CASCADE,
  password_hash VARCHAR(60) NOT NULL
);

CREATE TABLE user_session (
  token CHAR(36) PRIMARY KEY,
  user_id INTEGER REFERENCES user_profile ON DELETE CASCADE ON UPDATE CASCADE,
  login_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expire_time TIMESTAMP NOT NULL CHECK (expire_time > CURRENT_TIMESTAMP)
);
