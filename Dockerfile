FROM node:12-alpine

ENV PORT 3000

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install

ADD . /usr/src/app
RUN npm run build

RUN apk update && apk add bash

EXPOSE 3000
CMD [ "node", "./dist/server.js" ]