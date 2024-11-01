import Util from "@util/util";
import CaseDefinition from "../casedefinition";
import CaseRoleDefinition from "./caseroledefinition";
import PlanItem from "../caseplan/planitem";
import UserEventDefinition from "../caseplan/usereventdefinition";

export default class CaseRoleReference {
    /**
     * Simple wrapper around a case role, helps in holding a references instead of the actual role.
     * @param {CaseRoleDefinition} role 
     * @param {PlanItem|UserEventDefinition} parent
     */
    constructor(public role: CaseRoleDefinition, public parent?: PlanItem | UserEventDefinition) {
    }

    remove() {
        if (this.parent) {
            Util.removeFromArray(this.parent.authorizedRoles, this);
        }
    }

    get id() {
        return this.role.id;
    }

    set id(newId) {
        const otherRole = this.role.caseDefinition.getElement(newId);
        if (otherRole && otherRole instanceof CaseRoleDefinition) {
            this.role = otherRole;
        } else {
            this.role = TEMPORARY_EMPTY_ROLE(this.role.caseDefinition);
        }
    }

    get name() {
        return this.role.name;
    }

    /**
     * Creates a temporary wrapper
     * @param {CaseDefinition} caseDefinition 
     * @returns {CaseRoleReference}
     */
    static createEmptyCaseRoleReference(caseDefinition: CaseDefinition) {
        return new CaseRoleReference(TEMPORARY_EMPTY_ROLE(caseDefinition));
    }
}

function TEMPORARY_EMPTY_ROLE(caseDefinition: CaseDefinition) {
    return <CaseRoleDefinition>{ // This is a 'temporary' case role definition
        id: '',
        name: '',
        caseDefinition
    }
}
