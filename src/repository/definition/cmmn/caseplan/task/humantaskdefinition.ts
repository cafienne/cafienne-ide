import { Element } from "../../../../../util/xml";
import HumanTaskFile from "../../../../serverfile/humantaskfile";
import Validator from "../../../../validate/validator";
import CaseDefinition from "../../casedefinition";
import CaseRoleReference from "../../caseteam/caserolereference";
import StageDefinition from "../stagedefinition";
import TaskDefinition from "./taskdefinition";
import CafienneWorkflowDefinition from "./workflow/cafienneworkflowdefinition";

export default class HumanTaskDefinition extends TaskDefinition {
    performerRef: CaseRoleReference;
    workflow: CafienneWorkflowDefinition;
    protected infix() {
        return 'ht';
    }

    constructor(importNode: Element, caseDefinition: CaseDefinition, public parent: StageDefinition) {
        super(importNode, caseDefinition, parent);
        this.performerRef = this.parseInternalReference('performerRef');
        /** @type {CafienneWorkflowDefinition} */
        this.workflow = this.parseImplementation(CafienneWorkflowDefinition);
    }

    validate(validator: Validator): void {
        super.validate(validator);

        if (this.performerRef.isInvalid) {
            validator.raiseError(this, `${this} has an invalid role reference '${this.performerRef}'`)
        }

        // validate TaskPairing
        if (this.rendezVous && this.fourEyes) {
            let counterparts = this.rendezVous.references;
            let opposites = this.fourEyes.references;
            // Verify that we cannot have "rendez-vous" with items that we also have "4-eyes" with.
            opposites.forEach(item => {
                if (counterparts.filter(counter => item.id === counter.id).length > 0) {
                    validator.raiseError(this, `${this} has a 4-eyes defined with ${item}, but also rendez-vous (either directly or indirectly). This is not valid.'`);
                }
            });
        }
    }

    get implementationReference() {
        return this.workflow.humanTaskRef;
    }

    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'humanTask', 'planningTable', 'performerRef', 'workflow');
    }

    get performer() {
        return this.performerRef.getDefinition();
    }

    /**
     * @returns {String} The name of the role that is assigned as the performer of the task
     */
    get performerName() {
        return this.performerRef.name;
    }

    get implementationClass() {
        return HumanTaskFile;
    }

    get implementationRef() {
        return this.workflow.humanTaskRef.fileName;
    }

    set implementationRef(ref) {
        this.workflow.humanTaskRef.update(ref);
    }

    get mappings() {
        if (!this.workflow) {
            return [];
        }
        return this.workflow.mappings;
    }

    get validatorRef() {
        return this.workflow.validatorRef.fileName;
    }

    set validatorRef(ref) {
        this.workflow.validatorRef.update(ref);
    }
}
