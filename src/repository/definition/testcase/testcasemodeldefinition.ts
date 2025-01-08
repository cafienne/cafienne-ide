import ModelDefinition from "../modeldefinition";
import TestcaseFile from "@repository/serverfile/testcasefile";
import FixtureDefinition from "./testfixturedefintion";

export default class TestcaseModelDefinition extends ModelDefinition {
    fixture: FixtureDefinition;

    /**
     * Imports an XML element and parses it into a in-memory definition structure.
     */
    constructor(public file: TestcaseFile) {
        super(file);
        this.fixture = this.parseElement('fixture', FixtureDefinition) ?? (() => { throw new Error("Fixture not found"); })();
    }

    toXML() {
        const xmlDocument = super.exportModel('testcase', 'fixture');
        return xmlDocument;
    }
}
