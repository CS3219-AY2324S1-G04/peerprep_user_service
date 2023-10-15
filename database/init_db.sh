#!/bin/bash

if ! [[ $ADMIN_EMAIL =~ ^[^[:space:]]+@[a-z0-9.-]+[a-z0-9-]$ ]]; then
    echo "ERROR: ADMIN_EMAIL does not conform to the email address format."
    exit 1
fi

if ! [[ $HASH_COST =~ ^[0-9]+$ && $HASH_COST -gt 0 ]]; then
    echo "ERROR: HASH_COST must be a positive integer."
    exit 1
fi

if [[ $ADMIN_PASSWORD = "" ]]; then
    ADMIN_PASSWORD=$POSTGRES_PASSWORD
fi

password_hash=$(htpasswd -bnBC $HASH_COST "" $ADMIN_PASSWORD | sed 's/:$2y/$2b/')
admin_email=$(echo $ADMIN_EMAIL | tr '[:upper:]' '[:lower:]')

psql -U $POSTGRES_USER -d $POSTGRES_DB -f /init.sql -c \
"INSERT INTO user_profile (username, email, role) VALUES ('admin', '$admin_email', 'admin');
INSERT INTO user_credential VALUES (1, '$password_hash');"

echo "Initialisation completed!"
