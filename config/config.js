/* Config for repository service
*
* serverPort: the port the express server runs on
* repository: path to the file repository (relative of absolute)
* use C:\\foo\\bar on windows
*
*/

const backendUrl = process.env.BACKEND_API_URL ? process.env.BACKEND_API_URL : 'http://localhost:2027';
const repositoryPath = process.env.MODELER_REPOSITORY_PATH ? process.env.MODELER_REPOSITORY_PATH : './repository';
const deployPath = process.env.MODELER_DEPLOY_PATH ? process.env.MODELER_DEPLOY_PATH : './repository_deploy';
const logTraffic = process.env.LOG_TRAFFIC ? process.env.LOG_TRAFFIC.trim().toLowerCase() !== 'false' : true;

const config = {
    serverPort: 2081
    ,log_traffic: logTraffic // defaults to true, set to false to only log failing HTTP calls.

//*
    ,repository: repositoryPath
    ,deploy: deployPath

/*/
    // Settings for cmmn test framework tests.
    // ,repository: '../cmmn-test-framework/casemodels/src'
    // ,deploy: '../cmmn-test-framework/casemodels/bin'

    // Settings for cafienne engine tests.
    ,repository: '../cafienne-engine/case-engine/src/test/resources/cmmn-modeler'
    // ,deploy: '../cafienne-engine/case-engine/src/test/resources/testdefinition'
    ,deploy: '../cafienne-engine/run/case-service/definitions'
//*/
    ,backendUrl
};

module.exports = config;
