#!/bin/sh

echo "export PG_MASTER_HOST=\"$PG_MASTER_HOST\"" > /scripts/.env
echo "export PG_MASTER_PORT=\"$PG_MASTER_PORT\"" >> /scripts/.env
echo "export PG_USER=\"$PG_USER\"" >> /scripts/.env
echo "export PG_PASS=\"$PG_PASS\"" >> /scripts/.env
echo "export PG_DB=\"$PG_DB\"" >> /scripts/.env

crond -f -l 7 -c /var/spool/cron/crontabs
