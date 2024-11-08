import CaseDefinition from "./case";
import Definition from "./definition";
import Definitions from "./definitions";
import Schema from "./schema";

export default class TypeDefinition extends Definition {
    schema: Schema;
    casesUsingThisType: Array<CaseDefinition> = [];

    constructor(public fileName: string, public definitionsDocument: Definitions) {
        super(fileName, definitionsDocument);
        this.schema = new Schema(this, this.element);
    }

    fillCaseFile(caseDefinition: CaseDefinition) {
        this.casesUsingThisType.push(caseDefinition);
        caseDefinition.caseFileModel.setAttribute('cafienne:typeRef', this.fileName);
        caseDefinition.caseFileModel.removeAttribute('typeRef');
        this.schema.convertToCaseFileItems(caseDefinition, caseDefinition.caseFileModel);
    }

    append() {
        this.schema.createCFID();
    }
}
