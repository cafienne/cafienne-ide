import Util from "@util/util";
import CaseDefinition from "../casedefinition";
import PlanItem from "../caseplan/planitem";
import UserEventDefinition from "../caseplan/usereventdefinition";
import ClassicCaseRoleDefinition from "./classiccaseroledefinition";

export default class CaseRoleReference {
    /**
     * Simple wrapper around a case role, helps in holding a references instead of the actual role.
     */
    constructor(public role: ClassicCaseRoleDefinition | string, public parent?: PlanItem | UserEventDefinition) {
    }

    remove() {
        if (this.parent) {
            Util.removeFromArray(this.parent.authorizedRoles, this);
        }
    }

    get id() {
        return this.role instanceof ClassicCaseRoleDefinition ? this.role.id : this.role;
    }

    set id(newId) {
        if (this.role instanceof ClassicCaseRoleDefinition) {
            const otherRole = this.role.caseDefinition.getElement(newId);
            if (otherRole && otherRole instanceof ClassicCaseRoleDefinition) {
                this.role = otherRole;
            } else {
                this.role = TEMPORARY_EMPTY_ROLE(this.role.caseDefinition);
            }    
        } else {
            this.role = newId;
        }
    }

    get name() {
        return this.role instanceof ClassicCaseRoleDefinition ? this.role.name : this.role;
    }

    /**
     * Creates a temporary wrapper
     */
    static createEmptyCaseRoleReference(caseDefinition: CaseDefinition) {
        return new CaseRoleReference(TEMPORARY_EMPTY_ROLE(caseDefinition));
    }
}

function TEMPORARY_EMPTY_ROLE(caseDefinition: CaseDefinition) {
    return <ClassicCaseRoleDefinition>{ // This is a 'temporary' case role definition
        id: '',
        name: '',
        caseDefinition
    }
}
