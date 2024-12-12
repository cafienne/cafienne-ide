import CaseDefinition from "@repository/definition/cmmn/casedefinition";
import Definitions from "@repository/deploy/definitions";
import Repository from "@repository/repository";
import TestcaseModelDefinition from "@repository/definition/testcase/testcasemodeldefinition";
import Tenant from "@cafienne/typescript-client/tenant/tenant";
import CafienneClientConfig from "@cafienne/typescript-client/config";
import User from "@cafienne/typescript-client/user";
import PlatformService from "@cafienne/typescript-client/service/platform/platformservice";
import TenantUser from "@cafienne/typescript-client/tenant/tenantuser";

export default class Runner {
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

    private async runTestcases(testcases: TestcaseModelDefinition[]): Promise<void> {
        await Promise.all(testcases.map(x => this.runTestcase(x)));
    }

    private async runTestcase(testcase: TestcaseModelDefinition): Promise<void> {
        console.log(`Running testcase: ${testcase.name}`);

        const adminUser = await new User("admin").login();
        console.log(`user logged in: ${adminUser}`);

        const tenant = await this.createTenant(adminUser);
    }

    private async createTenant(adminUser: User): Promise<Tenant | undefined> {
        const tenantOwner = new TenantUser(adminUser.id);
        tenantOwner.isOwner = true;
        const tenant = new Tenant("Test-tenant-3" + Date.now().toFixed(3), [tenantOwner ]);
        await PlatformService.createTenant(adminUser, tenant, 204);

        return tenant;
    }
}

