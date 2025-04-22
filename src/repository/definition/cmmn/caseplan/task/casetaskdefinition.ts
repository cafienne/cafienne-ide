import { Element } from "../../../../../util/xml";
import CaseFile from "../../../../serverfile/casefile";
import ExternalReference from "../../../references/externalreference";
import CaseDefinition from "../../casedefinition";
import StageDefinition from "../stagedefinition";
import TaskDefinition from "./taskdefinition";

export default class CaseTaskDefinition extends TaskDefinition {
    caseRef: ExternalReference<CaseDefinition>;
    protected infix(): string {
        return 'ct';
    }

    constructor(importNode: Element, caseDefinition: CaseDefinition, public parent: StageDefinition) {
        super(importNode, caseDefinition, parent);
        this.caseRef = this.parseReference('caseRef');
    }

    protected get implementationReference() {
        return this.caseRef;
    }

    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'caseTask', 'caseRef', 'mappings');
    }

    get implementationClass() {
        return CaseFile;
    }

    get implementationRef() {
        return this.caseRef.fileName;
    }

    set implementationRef(ref) {
        this.caseRef.update(ref);
    }
}
