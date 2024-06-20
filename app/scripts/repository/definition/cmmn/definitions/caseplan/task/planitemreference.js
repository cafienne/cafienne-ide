/**
 * Helper class to keep reference to the definition of a PlanItem
 */
class PlanItemReference extends ElementDefinition {
    constructor(importNode, modelDefinition, parent) {
        super(importNode, modelDefinition, parent);
        this.taskRef = this.parseAttribute('taskRef');
    }

    /**
     * @returns {PlanItem}
     */
    get task() {
        /** @type {PlanItem} */
        const item = this.modelDefinition.getElement(this.taskRef, PlanItem);
        return item;
    }

    /**
     * @param {PlanItem} task 
     */
    adopt(task) {
        this.taskRef = task.id;
    }

    /**
     * @returns {Boolean}
     * @param {PlanItem} task 
     */
    is(task) {
        return task.id === this.taskRef;
    }

    removeDefinitionReference(removedElement) {
        const ourTask = this.task;
        super.removeDefinitionReference(removedElement);
        if (removedElement === ourTask) {
            this.removeDefinition();
        }
    }

    createExportNode(parentNode) {
        if (this.task) {
            super.createExportNode(parentNode, 'task', 'taskRef');
            this.exportNode.setAttribute('taskName', this.task.name);
        }
    }
}
