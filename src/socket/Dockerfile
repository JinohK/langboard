FROM node:20
WORKDIR /app

RUN apt-get update && apt-get install -y
COPY . .
RUN yarn install
RUN yarn run build
RUN yarn global add pm2

CMD ["pm2-runtime", "ecosystem.config.cjs"]