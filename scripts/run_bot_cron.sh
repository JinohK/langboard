#!/bin/bash -l

cd /app
langboard run:bot:cron "$@"

exit 0