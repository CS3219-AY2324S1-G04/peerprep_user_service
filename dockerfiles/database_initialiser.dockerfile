FROM node:lts-hydrogen

COPY ./build /peerprep_user_service_database_initialiser/
COPY package.json /peerprep_user_service_database_initialiser/
COPY package-lock.json /peerprep_user_service_database_initialiser/

WORKDIR /peerprep_user_service_database_initialiser

RUN npm install --omit=dev -y

CMD node ./jobs/database_initialiser/database_initialiser.js
