import Utilities from '../src/server/util/utilities';
import TestConfiguration from './testconfiguration';
import TestDeployAllTypes from './tests/deploy/testdeployalltypes';
import TestDeployComplexCase from './tests/deploy/testdeploycomplex';
import TestDeployComplexSubCase from './tests/deploy/testdeploycomplex_subcase';
import TestDeployHelloWorld from "./tests/deploy/testdeployhelloworld";
import TestDeployMain from './tests/deploy/testdeploymain';
import TestDeployMainType from './tests/deploy/testdeploymaintype';
import TestDeployTypeRef from './tests/deploy/testdeploytyperef';
import TestDeployNewCriterionFormat from './tests/deploy/testdeploynewcriterionformat';
import TestList from './tests/testlist';
import TestLoadAndSave from './tests/testloadandsave';
import TestViewCMMN from "./tests/testviewcmmn";
import TestDeployPlanningTable from './tests/deploy/testdeployplanningtable';
import TestDeployElements from './tests/deploy/testdeployelements';

// TestDeployOutput should be last test in the testset
const testset: Array<Function> = [TestDeployHelloWorld,
    TestDeployTypeRef, 
    TestDeployComplexCase,
    TestDeployAllTypes,
    TestDeployComplexSubCase,
    TestDeployMain,
    TestDeployMainType,
    TestViewCMMN,
    TestLoadAndSave,
    TestList,
    TestDeployNewCriterionFormat,
    TestDeployPlanningTable,
    TestDeployElements,
];

try {
    runTests();
    process.exit(0);
} catch (error) {
    console.log("Failure while testing the repository code:\n\n", error);
    process.exit(-1);
}

function runTests() {
    const configArguments: Array<string> = process.argv.slice(2);

    const testNames = testset.map(test => test.name.toLowerCase().replace('test', ''));

    const allTests = configArguments.length === 0 ? testNames : configArguments.map(test => test.toLowerCase().replace('test', ''));

    const tests: Array<any> = testset.filter(test => allTests.indexOf(test.name.toLowerCase().replace('test', '')) >= 0);
    console.log(`Running ${tests.length} tests: ${tests.map(t => t.name).join(' -- ')}`)

    tests.forEach(test => {
        // readline.question("Press enter to start test " + test.name);
        console.log("\nStart test " + test.name);
        new test();
    });

    console.log(`Completed ${tests.length} tests: ${tests.map(t => t.name).join(' -- ')}`)

    const files = Utilities.getFiles(new TestConfiguration().repository);
    console.log("Files: " + files[0].constructor.name);
}
