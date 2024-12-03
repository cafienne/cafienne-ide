import ModelDefinition from "../modeldefinition";
import TestcaseFile from "@repository/serverfile/testcasefile";

export default class TestcaseModelDefinition extends ModelDefinition {
    /**
     * Imports an XML element and parses it into a in-memory definition structure.
     */
    constructor(public file: TestcaseFile) {
        super(file);
    }


    toXML() {
        const xmlDocument = super.exportModel('testcase');
        return xmlDocument;
    }
}
