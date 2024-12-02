import ValidationContext from "@repository/validate/validation";
import CaseDefinition from "../casedefinition";
import EventListenerDefinition from "./eventlistenerdefinition";
import { TaskStageDefinition } from "./planitem";
import PlanningTableDefinition from "./planningtabledefinition";

export default class UserEventDefinition extends EventListenerDefinition {
    static get infix() {
        return 'ue';
    }

    constructor(importNode: Element, caseDefinition: CaseDefinition, public parent: TaskStageDefinition | PlanningTableDefinition) {
        super(importNode, caseDefinition, parent);
    }

    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'userEvent');
    }

    validate(validationContext: ValidationContext) {
        super.validate(validationContext);
    }
}
