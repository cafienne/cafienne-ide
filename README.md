﻿# Cafienne IDE

## License

This code is available under the [GNU AFFERO GENERAL PUBLIC LICENSE v3](LICENSE).

## Getting Started

### Install pre-requesites

* install nodejs >= 22.3.0 (see [nodejs.org](http://nodejs.org)) and npm (comes with nodejs)
* install yarn >= 1.22.22 ( run 'npm install -g yarn' ) (see https://classic.yarnpkg.com)

### Getting the code and building the modeler

* Clone the Cafienne IDE and run index.html `git clone https://github.com/cafienne/cafienne-ide.git`
* change into the `cafienne-ide` directory
* run `npm install`

### Building a docker image and running it

This assumes you have [Docker](https://www.docker.com/products/overview) up and running on your machine.

To build the docker image use the following commands:

1. change into the `cafienne-ide` directory
2. run `docker build -t ide .`

To create/run a container use the following commands:

* run (this removes the container when stopped) `docker run --rm --name modeler -p2081:2081 ide`
* use `docker run -d --name modeler -p2081:2081 ide` to run the container in the background
* connect your browser to [http://localhost:2081](http://localhost:2081) to open the modeler
* to stop the container open a second terminal and run `docker stop modeler`

When running the above commands all models are lost when the container is stopped. To solve this you can map
folders on the host system to the container.

To mount the volumes that holds the case models and deployable models (output) use the following command:

`docker run --rm --name modeler -p2081:2081 -v <path_to_models_on_host>:/usr/src/app/repository -v <path_to_deploy_on_host>:/usr/src/app/repository_deploy ide`

For example, create to folders in your home folder called `models` and `deploy`, and run the container
with this command:

`docker run --rm --name modeler -p2081:2081 -v ~/models:/usr/src/app/repository -v ~/deploy:/usr/src/app/repository_deploy ide`


### Running yarn commands

To start developing, run:

```sh
$ yarn install
$ yarn build
$ yarn go
```

This will fire up a local web server, open http://localhost:2081 in your default browser and watch files for changes, reloading the browser automatically via [LiveReload].

To run the tests in the browser, run:

```sh
```

To make a production-ready build of the app, run:

```sh
```

To preview the production-ready build to check if everything is ok:

```sh
```

## Tasks

To get the list of available tasks, run:

```sh
```

## Fixing linting errors

```
$ npm run eslint-fix
```

## Config
The modeler contains a file based repository service. To config the service, edit the `config.js` in the config folder.
See the `config.js` file for the settings.

## Usage

The Cafienne IDE is intended for regular software developers.
The OMG has published the [Case Management and Model Notation (CMMN) specification](http://www.omg.org/spec/CMMN/).
You can use this specification for creating case models in the IDE.

### RESTRICTIONS

Development and testing of the Cafienne IDE is mostly done with latest versions of Google Chrome.

### Other info
