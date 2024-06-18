import HumanTaskModelElementDefinition from "./humantaskmodelelementdefinition";

export default class TaskModelDefinition extends HumanTaskModelElementDefinition {
    constructor(importNode, modelDefinition, parent) {
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

    createExportNode(parentNode) {
        if (this.value) {
            super.createExportNode(parentNode, 'task-model');
            this.exportNode.textContent = this.taskModel || '';
        }
    }
}
