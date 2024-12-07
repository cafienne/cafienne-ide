import TestcaseFile from "../../../repository/serverfile/testcasefile";
import ModelDefinition from "../modeldefinition";
import FixtureDefinition from "./testfixturedefintion";

export default class TestcaseModelDefinition extends ModelDefinition {
    fixture: FixtureDefinition;

    /**
     * Imports an XML element and parses it into a in-memory definition structure.
     */
    constructor(public file: TestcaseFile) {
        super(file);
        this.fixture = this.parseElement('fixture', FixtureDefinition) ?? this.createDefinition(FixtureDefinition);
    }

    toXML() {
        const xmlDocument = super.exportModel('testcase', 'fixture');
        return xmlDocument;
    }
}
