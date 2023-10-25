#!/bin/bash

### Constants ###
api_image_name="peerprep_user_service_api"
database_initialiser_image_name="peerprep_user_service_database_initialiser"
export_dir="./docker_build"

instructions="\n
This script builds Docker images, exports them to \"./docker_build\", then pushes them to Docker Hub.\n
\n
The default configuration builds all images and does not push them to Docker Hub. Arguments can be specified to change the script behaviour.\n
\n
Arguments:\n
-h\t\t\t\t                 Prints the help message.\n
-p DOCKER_HUB_USERNAME\t\t Enables pushing to Docker Hub after building. The images will be built with \"DOCKER_HUB_USERNAME/\" prepended.\n
-i IMAGE\t\t\t             Specifies the image to build and push. Value can be \"api\" or \"database_initialiser\". This argument can be specified multiple times to include multiple images.\n
-t TAG\t\t\t\t             Tags the images built with \"TAG\".
"

### Parse CLI Arguments ###
build_api=0
build_database_initaliser=0
image_tag="latest"

while getopts hp:i:t: flag
do
  case "${flag}" in
    h)
      echo -e $instructions
      exit 0
      ;;
    p)
      docker_hub_username="${OPTARG}/"
      ;;
    i)
      case ${OPTARG} in
        api)
          build_api=1
          ;;
        database_initialiser)
          build_database_initaliser=1
          ;;
      esac
      ;;
    t)
      image_tag=":$OPTARG"
  esac
done

if [[ $build_api == 0 && $build_database_initaliser == 0 ]]; then
  build_api=1
  build_database_initaliser=1
fi

### Transpile Typescript ###
echo "Transpiling Typescript ..."

npm run build

if [[ $? -ne 0 ]]; then
    echo "Transpile failed."
    exit 1
fi

echo "Transpile successful."

### Build Images ###
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

  mkdir -p $export_dir
  docker image save --output=$export_file $image_name

  echo "Exported image to $export_file"
}

if [[ $build_api == 1 ]]; then
  build_image "api.dockerfile" ${docker_hub_username}${api_image_name}${image_tag}

  if [[ $? -ne 0 ]]; then
      exit 1
  fi
fi

if [[ $build_database_initaliser == 1 ]]; then
  build_image "database_initialiser.dockerfile" ${docker_hub_username}${database_initialiser_image_name}${image_tag}

  if [[ $? -ne 0 ]]; then
      exit 1
  fi
fi

### Push Images to Docker Hub ###
push() {
  image_name=$1

  echo "Pushing $image_name to Docker Hub ..."

  docker image push $image_name

  if [[ $? -ne 0 ]]; then
      echo "Push failed."
      exit 1
  fi

  echo "Push successful."
}

if [[ $build_api == 1 ]]; then
  push ${docker_hub_username}${api_image_name}${image_tag}

  if [[ $? -ne 0 ]]; then
      exit 1
  fi
fi

if [[ $build_database_initaliser == 1 ]]; then
  push ${docker_hub_username}${database_initialiser_image_name}${image_tag}

  if [[ $? -ne 0 ]]; then
      exit 1
  fi
fi
