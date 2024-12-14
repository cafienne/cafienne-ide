import ExternalReference from "@repository/definition/references/externalreference";
import ProcessModelDefinition from "@repository/definition/process/processmodeldefinition";
import ProcessFile from "@repository/serverfile/processfile";
import CaseDefinition from "../../casedefinition";
import StageDefinition from "../stagedefinition";
import TaskDefinition from "./taskdefinition";

export default class ProcessTaskDefinition extends TaskDefinition {
    processRef: ExternalReference<ProcessModelDefinition>;
    static get infix() {
        return 'pt';
    }

    constructor(importNode: Element, caseDefinition: CaseDefinition, public parent: StageDefinition) {
        super(importNode, caseDefinition, parent);
        this.processRef = this.parseReference('processRef');
    }

    loadImplementation(): void {
        this.setImplementation(this.implementationRef, this.processRef.getDefinition());
    }

    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'processTask', 'processRef', 'mappings');
    }

    get implementationClass() {
        return ProcessFile;
    }

    get implementationRef() {
        return this.processRef.fileName;
    }

    set implementationRef(ref) {
        this.processRef.update(ref);
    }
}
