# CaseFabric Repository
A TypeScript package that can create and compile independent files CaseFabric design time source files into CMMN compliant definitions file.

> This package is the successor of the [@cafienne/repository](https://www.npmjs.com/package/@cafienne/repository) package.

# Compilation Usage 

This package can be used to do compilation of CaseFabric source models.

## Setup
It assumes a setup with 2 folders on disk, one having the source models, the other as the target for the compiled models. The latter one will be created if it does not exist.

The default locations are:

```
./repository
./repository_deploy
```

The locations can be overriden through environment variables

```
MODELER_REPOSITORY_PATH = your_source_folder_for_models
MODELER_DEPLOY_PATH = your_target_folder_for_compiled_models
```

## More complex setup

An alternative, more complex project setup with a `package.json` file should contain (at least) the below content

```json
{
  "dependencies": {
    "@casefabric/repository": "^0.2.1"
  }
}
```

For example
```json
{
...
  "scripts": {
    "compileModel": "cross-env MODELER_REPOSITORY_PATH=./src/casemodels MODELER_DEPLOY_PATH=./dist/cmmn compile",
  },
  "devDependencies": {
    "@casefabric/repository": "^0.2.1",
    "cross-env": "^7.0.3"
  }
...
}
```

In a project with the following structure:

```
// Raw source:

src/
└── casemodels
    ├── a_new_moon.case
    └── greeting.type

↓↓↓

// Transpiled with @casefabric/repository

dist/
└── cmmn
    └── a_new_moon.xml
```



Then install the package with you favorite package manager, e.g. `npm` or `yarn`.

## Running the compilation

### Compiling entire directory
Take the following steps to compile the source models in the directory

```bash
npm run compile
```

Or with the example setup above:
```bash
npm run compileModel
```


### Compiling a specific set of models

```bash
npm run compile helloworld.case hellomoon etc ...

```

The compile command will check if the arguments can be resolved to a file in the source folder.
If a file cannot be found, it will print an error message for that specific file, and continue with the remaining arguments.

Note that the filename resolution is case sensitive
