'use strict';

import Repository from "@repository/repository";
import FileSystemDefinitionStorage from "@repository/storage/filesytemdefinitionstorage";
import Runner from "./runner/runner";

// Main function
(async () => {
    try {
        const args = process.argv.slice(2); // Get command-line arguments excluding the first two elements
        const repository = new Repository(new FileSystemDefinitionStorage('./repository'));
        await repository.listModels();
        const runnerInstance = new Runner(repository);
        await runnerInstance.runTests(args[0]);
    } catch (error) {
        console.error('Error:', error);
    }
})();