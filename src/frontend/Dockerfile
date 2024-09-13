FROM node:20
WORKDIR /app

RUN apt-get update && apt-get install -y
COPY . .
RUN yarn install

CMD ["yarn", "run", "dev"]
