FROM node:lts-hydrogen

COPY ./build /peerprep_user_service_api/
COPY package.json /peerprep_user_service_api/
COPY package-lock.json /peerprep_user_service_api/

WORKDIR /peerprep_user_service_api

RUN npm install --omit=dev -y

CMD node main.js
