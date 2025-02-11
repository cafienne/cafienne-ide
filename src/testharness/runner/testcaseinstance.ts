import { assertCasePlan, Case, CaseService, CaseTeam, CaseTeamUser, PlatformService, State, Tenant, TenantUser, User } from "@casefabric/typescript-client";

import CaseDefinition from "../../repository/definition/cmmn/casedefinition";
import ExternalReference from "../../repository/definition/references/externalreference";
import TestcaseModelDefinition from "../../repository/definition/testcase/testcasemodeldefinition";
import Definitions from "../../repository/deploy/definitions";

export default class TestcaseInstance {
    tenantOwner: TenantUser;
    tenant: Tenant;
    steps: Step[];
    caseInstance?: Case;

    constructor(public adminUser: User, public testcase: TestcaseModelDefinition) {
        // make admin user tenant owner
        this.tenantOwner = new TenantUser(this.adminUser.id);
        this.tenantOwner.isOwner = true;
        this.tenant = new Tenant("Test-tenant-" + Date.now().toFixed(), [this.tenantOwner]);

        this.steps = [
            new Step("Fixture setup", () => this.setupFixture()),
            new Step("Start case", () => this.startCaseInstance()),
            new Step("Case completed", () => this.caseCompleted())];
    }
    async caseCompleted(): Promise<void> {
        await assertCasePlan(this.tenantOwner, this.caseInstance!, State.Completed);
    }

    async setupFixture(): Promise<void> {

        // make sure all users are logged in
        await Promise.all(this.tenant.users.map(async user => {
            await user.login();
        }));


        await PlatformService.createTenant(this.tenantOwner, this.tenant, 204);
    }

    async startCaseInstance(): Promise<void> {
        const caseOwner = new CaseTeamUser(this.tenantOwner);
        caseOwner.isOwner = true;
        const caseTeam = new CaseTeam([caseOwner]);

        const compiledCase = compileCase(this.testcase.fixture.caseRef);

        this.caseInstance = await CaseService.startCase(this.tenantOwner, { tenant: this.tenant, definition: compiledCase, inputs: {}, caseTeam, debug: true })
    }


    async run(): Promise<TestcaseInstance> {
        console.group(`Running testcase: ${this.testcase.name}`);

        for (const step of this.steps) {
            await step.run();

            if (step.status === "failed") {
                break;
            }
        }

        console.groupEnd();

        return this;
    }
}

class Step {
    status: "pending" | "running" | "passed" | "failed" = "pending";
    description: string = "";

    constructor(public name: string, public action: () => Promise<void>) {
    }

    async run(): Promise<void> {
        console.log(`Running step: ${this.name}`);
        try {
            await this.action();
            this.status = "passed";
        } catch (error: any) {
            console.error(`Error in step: ${this.name}`, error);
            this.status = "failed";
            this.description = error.toString();
        }
    }
}
function compileCase(caseRef: ExternalReference<CaseDefinition>): string {
    const caseDefinitionSet = new Definitions(caseRef.getDefinition()!);
    const compiledCase = caseDefinitionSet.contents();
    return compiledCase;
}
