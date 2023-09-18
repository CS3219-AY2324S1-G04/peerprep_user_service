#!/bin/bash

if ! [[ $ADMIN_EMAIL =~ ^[^[:space:]]+@[a-z0-9.-]+[a-z0-9-]$ ]]; then
    echo "ERROR: ADMIN_EMAIL does not conform to the email address format."
    exit 1
fi

if ! [[ $HASH_SALT_ROUNDS =~ ^[0-9]+$ && $HASH_SALT_ROUNDS -gt 0 ]]; then
    echo "ERROR: HASH_SALT_ROUNDS must be a positive integer."
    exit 1
fi

if [[ $ADMIN_PASSWORD = "" ]]; then
    ADMIN_PASSWORD=$POSTGRES_PASSWORD
fi

password_hash=$(htpasswd -bnBC $HASH_SALT_ROUNDS "" $ADMIN_PASSWORD | sed 's/:$2y/$2b/')
admin_email=$(echo $ADMIN_EMAIL | tr '[:upper:]' '[:lower:]')

psql -U postgres -d user -f /init.sql -c \
"INSERT INTO User_Profiles (username, email, role) VALUES ('admin', '$admin_email', 'admin');
INSERT INTO User_Credentials VALUES (1, '$password_hash');"

echo "Initialisation completed!"
