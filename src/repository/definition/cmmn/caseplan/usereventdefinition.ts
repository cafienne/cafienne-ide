import CaseDefinition from "../casedefinition";
import EventListenerDefinition from "./eventlistenerdefinition";
import { TaskStageDefinition } from "./planitem";
import PlanningTableDefinition from "./planning/planningtabledefinition";

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
}
