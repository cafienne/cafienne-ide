import TestcaseFile from "../../../repository/serverfile/testcasefile";
import GraphicalModelDefinition from "../graphicalmodeldefinition";
import FixtureDefinition from "./testfixturedefintion";

export default class TestcaseModelDefinition extends GraphicalModelDefinition {
    fixture: FixtureDefinition;

    /**
     * Imports an XML element and parses it into a in-memory definition structure.
     */
    constructor(public file: TestcaseFile) {
        super(file, file.fileName + '.dimensions');

        this.fixture = this.parseElement('fixture', FixtureDefinition) ?? this.createDefinition(FixtureDefinition);
    }

    toXML() {
        const xmlDocument = super.exportModel('testcase', 'fixture');
        return xmlDocument;
    }
}
