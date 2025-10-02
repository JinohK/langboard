#!/bin/bash

CURRENT_DIR=$(basename "$PWD")

if [[ "$CURRENT_DIR" == "langboard" && -d "./docker" ]]; then
    cd docker
elif [[ "$CURRENT_DIR" == "docker" ]]; then
    :
else
    echo "You must run this script from the langboard root directory or the docker directory."
    exit 1
fi

cd ../

source .env

declare -A service_envs=(
  [nginx]="server-common"
  [api]="server-common server"
  [ui]="server-common"
  [socket]="server-common server"
  [flows]="server-common server"
)

echo ${service_envs[@]}

for service in "${!service_envs[@]}"; do
  output_file="docker/envs/.${service}.env"
  echo "Generating $output_file from templates: ${service_envs[$service]}"

  # 비워서 시작
  : > "$output_file"

  # 템플릿 이름들을 공백으로 split
  for template in ${service_envs[$service]}; do
    template_path="docker/envs/${template}.env.template"

    if [[ -f "$template_path" ]]; then
      cat "$template_path" >> "$output_file"
    else
      echo "⚠️ Warning: template '$template_path' not found"
    fi
  done
done