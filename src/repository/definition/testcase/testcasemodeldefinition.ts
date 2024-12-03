import TestcaseFile from "../../../repository/serverfile/testcasefile";
import ModelDefinition from "../modeldefinition";

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
