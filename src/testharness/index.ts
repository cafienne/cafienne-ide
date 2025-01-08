'use strict';

import Repository from "@repository/repository";
import FileSystemDefinitionStorage from "@repository/storage/filesytemdefinitionstorage";
import Runner from "./runner/runner";
import TestcaseInstance from "./runner/testcaseinstance";

// Main function
(async () => {
    try {
        const args = process.argv.slice(2); // Get command-line arguments excluding the first two elements
        console.group(`Testharness ${args}`);
        const repository = new Repository(new FileSystemDefinitionStorage('./repository'));
        await repository.listModels();
        const runnerInstance = new Runner(repository);
        const results = await runnerInstance.runTests(args[0]);

        printResults(results);
    } catch (error) {
        console.error('Error:', error);
    }
    finally {
        console.groupEnd();
    }
})();

function printResults(results: TestcaseInstance[]) {
    results.forEach(result => {
        console.group(`Testcase: ${result.testcase.name}: ${result.steps.filter(step => step.status === "failed").length > 0 ? "Failed" : "Passed"}`);
        result.steps.forEach(step => {
            console.log(`Step: ${step.name}: ${step.status} ${step.description}`);
        });
        console.groupEnd();
    });
}
