const UNSPECIFIED = 'Unspecified';
const UNSPECIFIED_URI = 'http://www.omg.org/spec/CMMN/DefinitionType/Unspecified';

const XMLELEMENT = 'XMLElement';
const XMLELEMENT_URI = 'http://www.omg.org/spec/CMMN/DefinitionType/XSDElement';

const UNKNOWN = 'Unknown';
const UNKNOWN_URI = 'http://www.omg.org/spec/CMMN/DefinitionType/Unknown';

class CaseFileDefinitionDefinition extends ModelDefinition {
    /**
     * Imports an XML element and parses it into a in-memory definition structure.
     * @param {CFIDFile} file
     */
    constructor(file) {
        super(file);
        this.file = file;
    }

    parseDocument() {
        super.parseDocument();
        this.definitionType = this.parseAttribute('definitionType', UNSPECIFIED_URI);
        this.structureRef = this.parseAttribute('structureRef', '');
        this.importRef = this.parseAttribute('importRef', '');
        this.properties = this.parseElements('property', PropertyDefinition)
        switch (this.definitionType) {
            case XMLELEMENT_URI: {
            }
            case UNKNOWN_URI: {
                // Nothing to be done
            }
            case UNSPECIFIED_URI: {
            }
        }
    }
    
    get editor() {
        return;
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