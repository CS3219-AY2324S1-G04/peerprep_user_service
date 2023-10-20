#!/bin/bash

echo "Building API ..."
echo

bash ./build_api_image.sh

if [[ $? -ne 0 ]]; then
    exit 1
fi

echo
echo "Building Database Initialiser ..."
echo

bash ./build_database_initialiser_image.sh

if [[ $? -ne 0 ]]; then
    exit 1
fi
