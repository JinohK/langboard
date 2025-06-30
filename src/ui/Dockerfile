FROM node:22
WORKDIR /app

RUN apt-get update && apt-get install -y
COPY . .
RUN yarn install
