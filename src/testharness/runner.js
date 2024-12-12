'use strict';
import pkg from './bundle-testharness.js';
const { Runner, Repository, FileSystemDefinitionStorage } = pkg;

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