#!/bin/bash
set -e

if ! test -f /app/requirements.txt; then
    cd /app
    pypy3 -m poetry export -f requirements.txt --output requirements.txt
    pypy3 -m pip install -r requirements.txt
fi

cd /app/src/backend
# pypy3 -m socketify ${PROJECT_NAME}:app --ws ${PROJECT_NAME}:ws --port ${BACKEND_PORT} --reload True --log-level debug
pypy3 -m socketify ${PROJECT_NAME}:app --ws ${PROJECT_NAME}:ws --port ${BACKEND_PORT} --reload True
# pypy3 -m poetry env use /opt/pypy/bin/pypy3
# pypy3 -m poetry update
# pypy3 -m poetry install
# pypy3 -m socketify langboard:app --ws langboard:ws --port 8080 --reload
# pypy3 -m poetry run langboard