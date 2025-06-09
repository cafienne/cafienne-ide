import { Element } from "../../../../../util/xml";
import CaseFile from "../../../../serverfile/casefile";
import Validator from "../../../../validate/validator";
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

    validate(validator: Validator): void {
        super.validate(validator);
        super.validateImplementation(validator);
        // TODO: check for cyclic references during startup, see CaseTaskDefinition.java:54 in engine.

        // if (this.caseRef.isEmpty) {
        //     validator.raiseError(this, this + " has no reference to a case implementing the task");
        // } else if (this.caseRef.getDefinition() === undefined) {
        //     validator.raiseError(this, this +" refers to a case called '" + this.caseRef.value +"' but that file does not exist");
        // }
    }

    get implementationReference() {
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
