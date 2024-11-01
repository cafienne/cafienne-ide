import ProcessFile from "@repository/serverfile/processfile";
import TaskDefinition from "./taskdefinition";
import CaseDefinition from "../../casedefinition";
import StageDefinition from "../stagedefinition";

export default class ProcessTaskDefinition extends TaskDefinition {
    processRef: string;
    static get infix() {
        return 'pt';
    }

    constructor(importNode: Element, caseDefinition: CaseDefinition, public parent: StageDefinition) {
        super(importNode, caseDefinition, parent);
        this.processRef = this.parseAttribute('processRef');
    }

    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'processTask', 'processRef', 'mappings');
    }

    get implementationClass() {
        return ProcessFile;
    }

    get implementationRef() {
        return this.processRef;
    }

    set implementationRef(ref) {
        this.processRef = ref;
    }
}
