import TestcaseModelDefinition from "../definition/testcase/testcasemodeldefinition";
import ServerFile from "./serverfile";

export default class TestcaseFile extends ServerFile<TestcaseModelDefinition> {
    createModelDefinition() : TestcaseModelDefinition {
        return new TestcaseModelDefinition(this);
    }
}
