FROM postgres

COPY init.sql /
COPY init_db.sh /docker-entrypoint-initdb.d/

RUN apt-get update && apt-get install apache2-utils -y
RUN chmod 744 /docker-entrypoint-initdb.d/init_db.sh

ENV POSTGRES_DB="user"
ENV ADMIN_PASSWORD=""
ENV ADMIN_EMAIL=""
ENV HASH_COST=10
