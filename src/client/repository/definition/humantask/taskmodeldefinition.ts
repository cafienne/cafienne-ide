import HumanTaskModelDefinition from "./humantaskmodeldefinition";
import HumanTaskModelElementDefinition from "./humantaskmodelelementdefinition";

export default class TaskModelDefinition extends HumanTaskModelElementDefinition {
    taskModel: string | null;
    constructor(importNode: Element, modelDefinition: HumanTaskModelDefinition, parent?: HumanTaskModelElementDefinition) {
        super(importNode, modelDefinition, parent);
        this.taskModel = this.importNode ? this.importNode.textContent : '';
    }

    /**
     * @returns {String}
     */
    get value() {
        return this.taskModel || '';
    }

    set value(value) {
        this.taskModel = value;
    }

    createExportNode(parentNode: Element) {
        if (this.value) {
            super.createExportNode(parentNode, 'task-model');
            this.exportNode.textContent = this.taskModel || '';
        }
    }
}
