#!/bin/bash

### Constants ###
api_image_name="peerprep_user_service_api"
database_initialiser_image_name="peerprep_user_service_database_initialiser"
export_dir="./docker_build"

cr="ghcr.io/cs3219-ay2324s1-g04/"

instructions="\n
Usage: build_images.sh [-h] [-p] [-i IMAGE] [-t TAG]\n
\n
This script builds Docker images, exports them to \"./docker_build\", then pushes them to the container registry. The default configuration builds all images and does not push them to the container registry. Arguments can be specified to change the script behaviour.\n
\n
Arguments:\n
-h\t\t                 Prints the help message.\n
-p\t\t                 Enables pushing to the container registry after building.\n
-i IMAGE\t             Specifies the image to build and push. Value can be \"api\" or \"database_initialiser\". This argument can be specified multiple times to include multiple images.\n
-t TAG\t\t             Tags the images built with \"TAG\".
"

### Functions ###
build_image () {
  dockerfile=$1
  image_name=$2

  export_file="$export_dir/$2.tar"

  echo "Building $image_name ..."

  docker image build . --tag=$image_name --file $dockerfile

  if [[ $? -ne 0 ]]; then
      echo "Build failed."
      exit 1
  fi

  echo "Build successful."

  echo "Exporting image ..."

  mkdir -p $(dirname $export_file)
  docker image save --output=$export_file $image_name

  echo "Exported image to $export_file"
}

push() {
  image_name=$1

  echo "Pushing $image_name to the container registry ..."

  docker image push $image_name

  if [[ $? -ne 0 ]]; then
      echo "Push failed."
      exit 1
  fi

  echo "Push successful."
}

### Parse CLI Arguments ###
should_build_api=0
should_build_database_initaliser=0
should_push=0

image_tag=":latest"

while getopts hpi:t: flag
do
  case "${flag}" in
    h)
      echo -e $instructions
      exit 0
      ;;
    p)
      should_push=1
      ;;
    i)
      case ${OPTARG} in
        api)
          should_build_api=1
          ;;
        database_initialiser)
          should_build_database_initaliser=1
          ;;
      esac
      ;;
    t)
      image_tag=":$OPTARG"
  esac
done

if [[ $should_build_api == 0 && $should_build_database_initaliser == 0 ]]; then
  should_build_api=1
  should_build_database_initaliser=1
fi

api_image_full_name=${cr}${api_image_name}${image_tag}
database_initialiser_full_name=${cr}${database_initialiser_image_name}${image_tag}

### Transpile Typescript ###
echo "Transpiling Typescript ..."

npm run build

if [[ $? -ne 0 ]]; then
    echo "Transpile failed."
    exit 1
fi

echo "Transpile successful."

### Build Images ###
if [[ $should_build_api == 1 ]]; then
  build_image "api.dockerfile" $api_image_full_name

  if [[ $? -ne 0 ]]; then
      exit 1
  fi
fi

if [[ $should_build_database_initaliser == 1 ]]; then
  build_image "database_initialiser.dockerfile" $database_initialiser_full_name

  if [[ $? -ne 0 ]]; then
      exit 1
  fi
fi

### Push Images to the Container Registry ###
if [[ $should_push == 0 ]]; then
  exit 0
fi

if [[ $should_build_api == 1 ]]; then
  push $api_image_full_name

  if [[ $? -ne 0 ]]; then
      exit 1
  fi
fi

if [[ $should_build_database_initaliser == 1 ]]; then
  push $database_initialiser_full_name

  if [[ $? -ne 0 ]]; then
      exit 1
  fi
fi
