import BaseDeployTestClass from "../basedeploytestclass";

// Test Deploy a main.case(typeRef="main.type") containing a sub.case(typeRef="main.type")
// As well main.case and sub.case re-uses the same main.type
// Expect identifiers and context references with correct path and should not clash for the sub.case vs main.case
export default class TestDeployMain extends BaseDeployTestClass {
    constructor() {
        super('main');
    }
}
