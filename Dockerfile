FROM node:12-alpine

ENV PORT 3000

WORKDIR /usr/src/app

ADD ./dist /usr/src/app

RUN apk update && apk add bash

EXPOSE 3000
CMD [ "node", "./server.js" ]