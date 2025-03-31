'use strict';

// Enable showing/hiding console logging
var logging = true;
const consoleFunctions: any = {};
wrapConsoleLogging();

import * as path from 'path';
import RepositoryConfiguration from '../config/config';
import Definitions from "./deploy/definitions";
import Repository from "./repository";
import CaseFile from "./serverfile/casefile";
import FileStorage from './storage/filestorage';
import LocalFileStorage from "./storage/localfilestorage";

const config = new RepositoryConfiguration();
const repositoryFolder = config.repository;
const deployFolder = config.deploy;

function newConsoleGroup(msg: string) {
    console.groupEnd();
    console.group('\n' + msg);
}

// Main function
(async () => {
    try {
        const args = process.argv.slice(2); // Get command-line arguments excluding the first two elements ('node' and 'deploy.mjs')
        if (args.length > 0) {
            newConsoleGroup(`Requested deployment of\n- ${args.join(('\n- '))}`);
        } else {
            newConsoleGroup(`Running deployment for entire repository at ${path.resolve(repositoryFolder)}`)
        }
        newConsoleGroup(`Loading and parsing repository contents ...`);
        logging = false;
        const fileStorage = new LocalFileStorage(config);
        const repository = new Repository(fileStorage);
        await repository.listModels();
        logging = true;


        const cases = repository.getCases();
        if (args.length === 0) {
            newConsoleGroup("Deploying entire repository")
            for (const $case of cases) {
                await compileAndWrite($case, fileStorage);
            }
            return;
        }

        const asCaseOrUndefined = (arg: string) => cases.find(file => file.name === arg || file.fileName === arg);
        var longestArg = args.reduce((a, b) => a.length > b.length ? a : b);

        const extendWithSpace = (arg: string) => `'${arg}'`.padEnd(longestArg.length + 2);

        newConsoleGroup("Resolving case definitions ...");
        const models = args.map(asCaseOrUndefined).filter((option, index) => {
            if (option) {
                console.log(`- ${extendWithSpace(args[index])}  ==> file '${path.resolve(repositoryFolder, option.fileName)}'`)
            } else {
                console.log(`- ${extendWithSpace(args[index])}  ==> Error FILE_NOT_FOUND`)
            }
            return option !== undefined;
        });
        console.groupEnd();
        newConsoleGroup("Deploying " + models.length + " cases")

        for (const model of models) {
            await compileAndWrite(model, fileStorage);
        }
    } catch (error) {
        console.error('Error:', error);
    }
    finally {
        console.groupEnd();
    }
})();

async function compileAndWrite(caseFile: CaseFile, fileStorage: FileStorage) {
    logging = false;
    const definitionSet = new Definitions(caseFile.definition!);
    var content = definitionSet.contents();
    if (typeof content === 'string' && !content.endsWith('\n')) {
        content = content + '\n';
    }
    logging = true;

    const file = `${caseFile.name}.xml`;
    console.log('- writing file ' + file)
    await fileStorage.deploy(file, content);
}

function wrapConsoleLogging() {
    for (const key in console) {
        if (typeof (console as any)[key] === 'function') {
            consoleFunctions[key] = (console as any)[key];
            (console as any)[key] = (...args: any[]) => {
                if (logging) {
                    consoleFunctions[key](...args);
                }
            }
        }
    }
}
