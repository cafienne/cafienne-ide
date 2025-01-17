'use strict';

// Enable showing/hiding console logging
var logging = true;
const consoleFunctions: any = {};
wrapConsoleLogging();

import Definitions from "../repository/deploy/definitions";
import Repository from "../repository/repository";
import FileSystemDefinitionStorage from "../repository/storage/filesytemdefinitionstorage";
import config from "../../config/config";
// import { writeFileSync } from "fs";
import * as fs from 'fs';
import * as path from 'path';
import CaseFile from "../repository/serverfile/casefile";

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
        const repository = new Repository(new FileSystemDefinitionStorage(repositoryFolder));
        await repository.listModels();
        logging = true;


        const cases = repository.getCases();
        if (args.length === 0) {
            newConsoleGroup("Deploying entire repository")
            cases.forEach(compileAndWrite)
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
        models.forEach(compileAndWrite);

    } catch (error) {
        console.error('Error:', error);
    }
    finally {
        console.groupEnd();
    }
})();

function compileAndWrite(caseFile: CaseFile) {
    logging = false;
    const definitionSet = new Definitions(caseFile.definition!);
    var content = definitionSet.contents();
    if (typeof content === 'string' && !content.endsWith('\n')) {
        content = content + '\n';
    }
    logging = true;

    const file = `${deployFolder}/${caseFile.name}.xml`;
    console.log('- writing file ' + file)
    fs.writeFileSync(file, content);
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