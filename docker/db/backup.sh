#!/bin/bash

BACKUPFOLDER="/backup"
FILENAME=$DBNAME"_$(date +%Y%m%d_%H%M)"
TARNAME=$DBNAME"*.tar.gz"
DELDAY=7

mkdir -p $BACKUPFOLDER

export PGPASSWORD=$POSTGRES_PASSWORD

echo "Backing up to $FILENAME.sql"
pg_dump -U $POSTGRES_USERNAME -d $POSTGRES_DATABASE -F c -b -v -f $BACKUPFOLDER/$FILENAME.dump

echo "Compressing to $FILENAME.tar.gz"
tar -czvf $BACKUPFOLDER/$FILENAME.tar.gz -C $BACKUPFOLDER $FILENAME.dump

echo "Deleting $FILENAME.dump"
rm $BACKUPFOLDER/$FILENAME.dump

echo "Deleting old backup files"
find $BACKUPFOLDER -name "${TARNAME}" -mtime +$DELDAY -delete