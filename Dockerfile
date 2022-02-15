from node:16-alpine

# ENV
ENV NEW_RELIC_NO_CONFIG_FILE=true

WORKDIR /usr/src/app

COPY package.json .
RUN yarn install

ADD . /usr/src/app
RUN yarn build

CMD [ "yarn", "start" ]
EXPOSE 8080
