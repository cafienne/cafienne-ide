import CaseFile from "@repository/serverfile/casefile";
import TaskDefinition from "./taskdefinition";
import StageDefinition from "../stagedefinition";
import CaseDefinition from "../../casedefinition";

export default class CaseTaskDefinition extends TaskDefinition {
    caseRef: string;
    static get infix(): string {
        return 'ct';
    }

    constructor(importNode: Element, caseDefinition: CaseDefinition, public parent: StageDefinition) {
        super(importNode, caseDefinition, parent);
        this.caseRef = this.parseAttribute('caseRef');
    }

    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'caseTask', 'caseRef', 'mappings');
    }

    get implementationClass() {
        return CaseFile;
    }

    get implementationRef() {
        return this.caseRef;
    }

    set implementationRef(ref) {
        this.caseRef = ref;
    }
}
