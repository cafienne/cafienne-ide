import XML from "@util/xml";
import Migrator from "../migrator";

export default class CaseTeamMigrator {
    roleElements: Element[];

    constructor(public migrator: Migrator) {
        const importNode = this.migrator.definition.importNode;
        this.roleElements = XML.getChildrenByTagName(importNode, 'caseRoles');
        if (this.roleElements.length === 0) {
            // Make sure we always have a CaseTeam element
            importNode.appendChild(importNode.ownerDocument.createElement('caseRoles'));
        }
    }

    needsMigration(): boolean {
        const classicRoles = XML.getChildrenByTagName(this.migrator.definition.importNode, 'caseRoles'); // More than 1 means CMMN 1.0 style roles.
        if (classicRoles.length === 0) {
            // No roles defined, so also we're safe here.
            return false;
        } else if (classicRoles.length === 1) {
            // We found 1 role tag. It can be both CMMN 1.0 and 1.1. If it is 1.0, it will have a name attribute...
            //  ... but if it is CMMN 1.1, then there is a child tag <role> ...
            const childRole = XML.getChildByTagName(classicRoles[0], 'role');
            const name = classicRoles[0].getAttribute('name');
            return !childRole && name !== null && name.trim().length > 0;    
        } else {
            // More than 1 role tag means we CMMN1.0 and need to migrate
            return true;
        }
    }

    run() {
        if (!this.needsMigration()) {
            return;
        }
        const importNode = this.migrator.definition.importNode;
        // CMMN 1.0 format, we must migrate. Also, if roles.length == 0, then we should create an element to avoid nullpointers.
        //  Note: if there is only 1 caseRoles tag it can be both CMMN1.0 or CMMN1.1;
        //  CaseTeamDefinition class will do the check if additional migration is required.
        if (this.roleElements.length) {
            this.migrator.migrated(`Converting ${this.roleElements.length} CMMN1.0 roles`);
        }


        // Create a new element
        const caseTeamElement = importNode.ownerDocument.createElement('caseRoles');
        importNode.appendChild(caseTeamElement);

        this.roleElements.forEach(role => {
            role.parentElement && role.parentElement.removeChild(role);
            caseTeamElement.appendChild(this.convertRoleDefinition(role));
        });
    }

    /**
     * 
     * @param {Element} element 
     */
    convertRoleDefinition(element: Element) {
        const clearAttribute = (name: string) => {
            const value = element.getAttribute(name);
            element.removeAttribute(name); // And clear the attribute
            return value;
        }

        const id = clearAttribute('id');
        const name = clearAttribute('name');
        const description = clearAttribute('description');
        const optionalDescription = name !== description ? `description="${description}"` : '';
        return XML.loadXMLString(`<role id="${id}" name="${name}" ${optionalDescription}/>`).documentElement;
    }
}
