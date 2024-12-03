import ExternalReference from "@repository/definition/externalreference";
import CaseFile from "@repository/serverfile/casefile";
import CaseDefinition from "../../casedefinition";
import StageDefinition from "../stagedefinition";
import TaskDefinition from "./taskdefinition";

export default class CaseTaskDefinition extends TaskDefinition {
    caseRef: ExternalReference<CaseDefinition>;
    static get infix(): string {
        return 'ct';
    }

    constructor(importNode: Element, caseDefinition: CaseDefinition, public parent: StageDefinition) {
        super(importNode, caseDefinition, parent);
        this.caseRef = this.parseReference('caseRef');
    }

    loadImplementation(): void {
        this.setImplementation(this.implementationRef, this.caseRef.getDefinition() as CaseDefinition);
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
