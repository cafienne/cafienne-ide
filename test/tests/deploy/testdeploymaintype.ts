import BaseDeployTestClass from "../basedeploytestclass";

// Test Deploy a maintype.case(typeRef="MainType.type") containing a subtype.case(typeRef="SubType.type")
// maintype.case and subtype.case are using their private MainType.type and SubType.type
// But As well MainType.type and SubType.type referring to the same nested Greeting.type
// Expect identifiers and context references with correct path and should not clash for the subtype.case vs maintype.case

export default class TestDeployMainType extends BaseDeployTestClass {
    constructor() {
        super('maintype');
    }
}
