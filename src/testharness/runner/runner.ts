import CaseDefinition from "@repository/definition/cmmn/casedefinition";
import Definitions from "@repository/deploy/definitions";
import CafienneClientConfig from "@cafienne/typescript-client/config";
import User from "@cafienne/typescript-client/user";
import Repository from "@repository/repository";
import TestcaseModelDefinition from "@repository/definition/testcase/testcasemodeldefinition";
 

export class Runner {
    repository: Repository;


    constructor(repository: Repository) {
        console.log("Runner constructor");
        this.repository = repository;

        // TODO: Fetch this from Settings in IDE (or as constructor arguments)
        // Set the configuration for the Cafienne client
        CafienneClientConfig.CafienneService.url = 'http://localhost:33027/';
        CafienneClientConfig.TokenService.url = 'http://localhost:33077/token';
        CafienneClientConfig.TokenService.issuer='http://localhost:33077'
    }

    async runTests(filePattern: string): Promise<string> {
        console.group("Test runner");
        console.log(`Running tests for ${filePattern}`);
        const testcases = this.repository.getTestcases()
            .filter(test => test.fileName.match(filePattern))
            .map(testcase => testcase.definition)
            .filter(testcase => testcase !== undefined) as TestcaseModelDefinition[];

        await this.runTestcases(testcases);

        console.groupEnd();
        return "success";
    }

    async runTestsForCase(caseDefinition: CaseDefinition): Promise<string> {
        console.group(`Test runner: ${caseDefinition.name}` );
        const allRelatedDefinitions = new Definitions(caseDefinition);
        const compiledCase = allRelatedDefinitions.contents();

        const relevantTestCases = this.repository.getTestcases()
            .filter(testcase => testcase.definition?.fixture?.caseRef.fileName === caseDefinition.file.fileName)
            .map(testcase => testcase.definition)
            .filter(testcase => testcase !== undefined) as TestcaseModelDefinition[];
        
        await this.runTestcases(relevantTestCases);
            
        console.groupEnd();

        return "success";
    }

    private async runTestcases(testcases: TestcaseModelDefinition[]) {
        testcases.forEach(testcase => {
            console.log(`Running testcase: ${testcase.name}`);
        });

     const adminUser = await new User("admin").login();

    }

/*    run(args: string[]) {
        this.repository.listModels().then(() => {
            console.log(this.repository.list.map(item => item.name).join(", "));
            console.log("Runner run");
            console.log("Command-line arguments:", args);
        }).catch(error => {
            console.error("Runner run error", error);
        });
    }*/
}

