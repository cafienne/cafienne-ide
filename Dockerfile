FROM node:19-bullseye-slim

WORKDIR /usr/app/src

COPY package.json yarn.lock ./

COPY . .

RUN yarn install

RUN yarn clean-build

RUN rm -r app
RUN rm -r config
RUN rm -r repository
RUN rm -r repository_deploy
RUN rm -r server
RUN rm -r src
RUN rm -r Dockerfile
RUN rm -r package.json
RUN rm -r tsconfig.json
RUN rm -r webpack.config.js
RUN rm -r yarn.lock

EXPOSE 2040

WORKDIR /usr/app/src/dist

# Create directories inside the "dist" folder for storing models
RUN mkdir repository
RUN mkdir repository_deploy

CMD ["node", "server/server.js" ]
