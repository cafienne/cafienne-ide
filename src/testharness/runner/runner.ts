import CaseDefinition from "@repository/definition/cmmn/casedefinition";
import Definitions from "@repository/deploy/definitions";
import Repository from "@repository/repository";
 
export class Runner {
    repository: Repository;

    constructor(repository: Repository) {
        console.log("Runner constructor");
        this.repository = repository;
    }

    async runTestForCase(caseDefinition: CaseDefinition): Promise<string> {
        console.group(`Test runner: ${caseDefinition.name}` );
        const allRelatedDefinitions = new Definitions(caseDefinition);
        const compiledCase = allRelatedDefinitions.contents();

        const relevantTestCases = this.repository.getTestcases()
            .filter(testcase => testcase.definition?.fixture?.caseRef.fileName === caseDefinition.file.fileName)
            .forEach(testcase => {
                console.log(`Running testcase: ${testcase.name}`);
            });
            
        console.groupEnd();

        return "success";
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

