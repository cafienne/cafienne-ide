import { UNSPECIFIED_URI } from "../../../ide/modeleditor/cfid/casefileitemdefinitioneditor";
import CFIDFile from "../../serverfile/cfidfile";
import ModelDefinition from "../modeldefinition";
import PropertyDefinition from "./propertydefinition";

export default class CaseFileDefinitionDefinition extends ModelDefinition {
    definitionType: string = '';
    structureRef: string = '';
    importRef: string = '';
    properties: PropertyDefinition[] = [];
    /**
     * Imports an XML element and parses it into a in-memory definition structure.
     * @param {CFIDFile} file
     */
    constructor(public file: CFIDFile) {
        super(file);
        this.definitionType = this.parseAttribute('definitionType', UNSPECIFIED_URI);
        this.structureRef = this.parseAttribute('structureRef', '');
        this.importRef = this.parseAttribute('importRef', '');
        this.properties = this.parseElements('property', PropertyDefinition)
    }

    get inputParameters() {
        console.warn('Case file has no input/output contract');
        return [];
    }

    get outputParameters() {
        console.warn('Case file has no input/output contract');
        return [];
    }

    toXML() {
        return super.exportModel('caseFileItemDefinition', 'id', 'name', 'definitionType', 'structureRef', 'importRef', 'properties');
    }
}
