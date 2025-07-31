/* Config settings for repository
*
* serverPort: the port the express server runs on
* repository: path to the file repository (relative of absolute)
* use C:\\foo\\bar on windows
*
*/
export default class RepositoryConfiguration {
    public repository: string = process.env.MODELER_REPOSITORY_PATH ? process.env.MODELER_REPOSITORY_PATH : './repository';
    public deploy: string = process.env.MODELER_DEPLOY_PATH ? process.env.MODELER_DEPLOY_PATH : './repository_deploy';
    public training: string = process.env.MODELER_TRAINING_PATH ? process.env.MODELER_TRAINING_PATH : './repository_training';
    
    constructor() {
        // Settings for cmmn test framework tests.
        // this.repository = '../cmmn-test-framework/casemodels/src';
        // this.deploy = '../cmmn-test-framework/casemodels/bin';

        // Settings for cafienne engine tests.
        // this.repository = '../cafienne-engine/case-engine/src/test/resources/cmmn-modeler';
        // this.deploy = '../cafienne-engine/case-engine/src/test/resources/testdefinition';

        // Deploy to IntelliJ run folder
        // this.deploy = '../cafienne-engine/run/case-service/definitions';
    }
}
