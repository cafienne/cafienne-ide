import ExternalReference from "../../../references/externalreference";
import ProcessModelDefinition from "../../../process/processmodeldefinition";
import ProcessFile from "../../../../serverfile/processfile";
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


    protected get implementationReference() {
        return this.processRef;
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
