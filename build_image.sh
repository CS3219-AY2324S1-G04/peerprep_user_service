#!/bin/bash

cd api
echo "Building API ..."
echo

./build_image.sh

if [[ $? -ne 0 ]]; then
    exit 1
fi

cd ../database
echo
echo "Building Database ..."
echo

./build_image.sh

if [[ $? -ne 0 ]]; then
    exit 1
fi
