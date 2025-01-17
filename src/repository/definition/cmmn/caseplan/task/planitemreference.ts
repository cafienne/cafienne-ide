import CMMNElementDefinition from "../../../cmmnelementdefinition";
import XMLSerializable from "../../../xmlserializable";
import CaseDefinition from "../../casedefinition";
import PlanItem from "../planitem";

/**
 * Helper class to keep reference to the definition of a PlanItem
 */
export default class PlanItemReference extends CMMNElementDefinition {
    taskRef: string;
    constructor(importNode: Element, modelDefinition: CaseDefinition, parent?: CMMNElementDefinition) {
        super(importNode, modelDefinition, parent);
        this.taskRef = this.parseAttribute('taskRef');
    }

    get task(): PlanItem {
        return <PlanItem> this.modelDefinition.getElement(this.taskRef, PlanItem);
    }

    adopt(task: PlanItem) {
        this.taskRef = task.id;
    }

    is(task: PlanItem | undefined): boolean {
        return task !== undefined && task.id === this.taskRef;
    }

    removeDefinitionReference(removedElement: XMLSerializable) {
        const ourTask = this.task;
        super.removeDefinitionReference(removedElement);
        if (removedElement === ourTask) {
            this.removeDefinition();
        }
    }

    createExportNode(parentNode: Element) {
        if (this.task) {
            super.createExportNode(parentNode, 'task', 'taskRef');
            this.exportNode.setAttribute('taskName', this.task.name);
        }
    }
}
