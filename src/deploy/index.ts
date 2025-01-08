'use strict';

import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "fs";
import Definitions from "@repository/deploy/definitions";
import Repository from "@repository/repository";
import FileSystemDefinitionStorage from "@repository/storage/filesytemdefinitionstorage";
import { Utilities } from "server/utilities";

// Main function
(async () => {
    try {
        const args = process.argv.slice(2); // Get command-line arguments excluding the first two elements
        console.group(`Testharness ${args}`);
        const repository = new Repository(new FileSystemDefinitionStorage('./repository'));
        await repository.listModels();

        for (const casemodel of repository.getCases()) {
            const definitionSet = new Definitions(casemodel.definition!);
            writeCompiledFile(definitionSet.contents(), casemodel.name)
        }

    } catch (error) {
        console.error('Error:', error);
    }
    finally {
        console.groupEnd();
    }
})();

function writeCompiledFile(content: string, name: string) {
    if (typeof content === 'string' && !content.endsWith('\n')) {
        content = content + '\n';
    }

    const file = `./repository_deploy/${name}.xml`;
    writeFileSync(file, content);
}

