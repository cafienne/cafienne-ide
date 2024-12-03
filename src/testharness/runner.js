'use strict';
const { Runner, run } = require("./bundle-testharness.js");

function main() {
    const args = process.argv.slice(2); // Get command-line arguments excluding the first two elements
    const runnerInstance = new Runner();
    runnerInstance.run(args);
}

main();