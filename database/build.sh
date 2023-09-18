#!/bin/bash

image_tag="peerprep_user_service_database"
export_file="./build/peerprep_user_service_database.tar"

echo "Building image ..."
echo

docker image build . --tag=$image_tag

if [[ $? -ne 0 ]]; then
    echo "Build failed!"
    exit 1
fi

echo
echo "Exporting image ..."

mkdir -p build
docker image save --output=$export_file $image_tag

echo "Exported image to $export_file"
