#!/bin/bash -l

CURRENT_DIR=$(basename "$PWD")

if [[ "$CURRENT_DIR" == "langboard" && -d "./scripts" ]]; then
    cd scripts
elif [[ "$CURRENT_DIR" == "scripts" ]]; then
    :
else
    echo "You must run this script from the langboard root directory or the scripts directory."
    exit 1
fi

./run_docker_compose.sh ollama-gpu
