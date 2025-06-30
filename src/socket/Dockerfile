FROM node:22
WORKDIR /app

RUN apt-get update && apt-get install -y
COPY . .
RUN yarn install
RUN yarn build
RUN yarn global add pm2

CMD ["pm2-runtime", "ecosystem.config.cjs"]