import CaseRoleDefinition from "../caseteam/caseroledefinition";
import CaseRoleReference from "../caseteam/caserolereference";
import EventListenerDefinition from "./eventlistenerdefinition";

export default class UserEventDefinition extends EventListenerDefinition {
    static get infix() {
        return 'ue';
    }

    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        this.authorizedRoles = [];
        this.authorizedRoleRefs = this.parseAttribute('authorizedRoleRefs');
    }

    resolveReferences() {
        super.resolveReferences();
        this.authorizedRoles = this.caseDefinition.findElements(this.authorizedRoleRefs, [], CaseRoleDefinition).map(role => new CaseRoleReference(role, this));
    }

    createExportNode(parentNode) {
        this.authorizedRoleRefs = super.flattenListToString(this.authorizedRoles);
        super.createExportNode(parentNode, 'userEvent', 'authorizedRoleRefs');
    }
}
