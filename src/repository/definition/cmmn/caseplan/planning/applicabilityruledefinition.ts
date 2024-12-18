import CaseDefinition from "../../casedefinition";
import CaseFileItemReference from "../../casefile/casefileitemreference";
import ConstraintDefinition from "../constraintdefinition";
import PlanningTableDefinition from "./planningtabledefinition";

export class ApplicabilityRuleDefinition extends ConstraintDefinition {
    constructor(importNode: Element, caseDefinition: CaseDefinition, parent: PlanningTableDefinition) {
        super(importNode, caseDefinition, parent);
    }

    // Override isNamedElement; by default Constraints are unnamed, but applicability rules form the exception
    isNamedElement() {
        return true;
    }

    set sourceRef(ref: string) {
        this.contextRef.update(ref);
    }

    get sourceRef(): CaseFileItemReference {
        return this.contextRef;
    }

    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'applicabilityRule');
    }
}